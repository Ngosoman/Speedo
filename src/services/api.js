import { supabase, hasSupabaseConfig } from '../lib/supabaseClient'
import { addDaysToDate, nowIsoDateTime, toDateTimeText } from '../lib/date'

function ensureSupabase() {
  if (!hasSupabaseConfig || !supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) to .env.local')
  }
}

function formatClientCode(numberValue) {
  return String(numberValue).padStart(3, '0')
}

async function getNextClientNumber() {
  const { data, error } = await supabase
    .from('clients')
    .select('client_number')
    .order('client_number', { ascending: false })
    .limit(1)

  if (error) {
    throw error
  }

  const currentMax = data?.[0]?.client_number || 0
  return currentMax + 1
}

async function upsertClientFromBooking(payload) {
  const { data: existing, error: existingError } = await supabase
    .from('clients')
    .select('*')
    .eq('email', payload.email)
    .maybeSingle()

  if (existingError) {
    throw existingError
  }

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from('clients')
      .update({
        full_name: payload.full_name,
        phone: payload.phone,
        date_of_birth: payload.date_of_birth,
        license_number: payload.license_number,
        license_expiry: payload.license_expiry,
        residential_address: payload.residential_address,
        work_address: payload.work_address,
        kra_pin: payload.kra_pin,
      })
      .eq('id', existing.id)
      .select('*')
      .single()

    if (updateError) {
      throw updateError
    }

    return updated
  }

  const nextClientNumber = await getNextClientNumber()

  const { data: created, error: createError } = await supabase
    .from('clients')
    .insert({
      client_number: nextClientNumber,
      client_code: formatClientCode(nextClientNumber),
      full_name: payload.full_name,
      email: payload.email,
      phone: payload.phone,
      date_of_birth: payload.date_of_birth,
      license_number: payload.license_number,
      license_expiry: payload.license_expiry,
      residential_address: payload.residential_address,
      work_address: payload.work_address,
      kra_pin: payload.kra_pin,
      status: 'active',
    })
    .select('*')
    .single()

  if (createError) {
    throw createError
  }

  return created
}

export async function getLookupData() {
  ensureSupabase()

  const [{ data: cars, error: carsError }, { data: owners, error: ownersError }, { data: clients, error: clientsError }] = await Promise.all([
    supabase.from('cars').select('*').order('created_at', { ascending: false }),
    supabase.from('owners').select('*').order('name'),
    supabase.from('clients').select('*').order('client_number'),
  ])

  if (carsError) throw carsError
  if (ownersError) throw ownersError
  if (clientsError) throw clientsError

  return {
    cars: cars || [],
    owners: owners || [],
    clients: clients || [],
  }
}

export async function submitBooking(formValues) {
  ensureSupabase()

  const client = await upsertClientFromBooking(formValues)
  const returnDate = addDaysToDate(formValues.pickup_date, formValues.number_of_days)
  const notesPayload = JSON.stringify({
    clientNotes: formValues.notes || '',
    checklist: formValues.car_checklist || {},
  })

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      client_id: client.id,
      car_id: formValues.car_id,
      pickup_location: formValues.pickup_location,
      dropoff_location: formValues.dropoff_location,
      pickup_datetime: toDateTimeText(formValues.pickup_date, formValues.pickup_time),
      return_datetime: toDateTimeText(returnDate, formValues.return_time),
      number_of_days: Number(formValues.number_of_days),
      driver_required: formValues.driver_required,
      notes: notesPayload,
      status: 'pending',
      submitted_at: nowIsoDateTime(),
    })
    .select('*, clients(*), cars(*)')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function getBookings() {
  ensureSupabase()

  const { data, error } = await supabase
    .from('bookings')
    .select('*, clients(*), cars(*), contracts(*)')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data || []
}

export async function updateBookingStatus({ bookingId, status, adminNotes }) {
  ensureSupabase()

  const { data, error } = await supabase
    .from('bookings')
    .update({
      status,
      admin_notes: adminNotes,
      approved_at: status === 'approved' ? nowIsoDateTime() : null,
    })
    .eq('id', bookingId)
    .select('*, clients(*), cars(*)')
    .single()

  if (error) {
    throw error
  }

  if (status === 'approved') {
    await createContractsForBooking(data)
  }

  return data
}

export async function updateBookingDetails({ bookingId, updates }) {
  ensureSupabase()

  const payload = {
    pickup_location: updates.pickup_location,
    dropoff_location: updates.dropoff_location,
    number_of_days: Number(updates.number_of_days),
    pickup_datetime: toDateTimeText(updates.pickup_date, updates.pickup_time),
    return_datetime: toDateTimeText(
      addDaysToDate(updates.pickup_date, updates.number_of_days),
      updates.return_time,
    ),
    car_id: updates.car_id,
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(payload)
    .eq('id', bookingId)
    .select('*, clients(*), cars(*)')
    .single()

  if (error) {
    throw error
  }

  return data
}

async function createContractsForBooking(booking) {
  const contractPayload = [
    {
      booking_id: booking.id,
      contract_type: 'admin-client',
      party_a: 'Admin',
      party_b: booking.clients?.full_name || 'Client',
      contract_text: `Admin and ${booking.clients?.full_name || 'Client'} contract for booking ${booking.id}`,
      generated_at: nowIsoDateTime(),
      status: 'generated',
    },
  ]

  if (booking.cars?.owner_id) {
    const { data: owner, error: ownerError } = await supabase
      .from('owners')
      .select('*')
      .eq('id', booking.cars.owner_id)
      .single()

    if (ownerError) {
      throw ownerError
    }

    contractPayload.push({
      booking_id: booking.id,
      contract_type: 'admin-owner',
      party_a: 'Admin',
      party_b: owner.name,
      contract_text: `Admin and ${owner.name} owner contract for car ${booking.cars?.name || ''}`,
      generated_at: nowIsoDateTime(),
      status: 'generated',
    })
  }

  const { error } = await supabase.from('contracts').insert(contractPayload)

  if (error) {
    throw error
  }
}

export async function upsertOwner(ownerInput) {
  ensureSupabase()

  const payload = {
    name: ownerInput.name,
    phone: ownerInput.phone,
    email: ownerInput.email,
  }

  if (ownerInput.id) {
    const { data, error } = await supabase
      .from('owners')
      .update(payload)
      .eq('id', ownerInput.id)
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('owners')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function createCar(carInput) {
  ensureSupabase()

  let photoUrl = ''
  if (carInput.photoFile) {
    const fileExt = carInput.photoFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e7)}.${fileExt}`
    const filePath = `cars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('cars')
      .upload(filePath, carInput.photoFile, { upsert: false })

    if (uploadError) {
      throw uploadError
    }

    const { data: publicData } = supabase.storage.from('cars').getPublicUrl(filePath)
    photoUrl = publicData.publicUrl
  }

  const { data, error } = await supabase
    .from('cars')
    .insert({
      name: carInput.name,
      model: carInput.model,
      daily_price: Number(carInput.daily_price),
      owner_id: carInput.owner_id,
      photo_url: photoUrl,
      status: 'available',
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateCarPrice(carId, dailyPrice) {
  ensureSupabase()

  const { data, error } = await supabase
    .from('cars')
    .update({ daily_price: Number(dailyPrice) })
    .eq('id', carId)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function createDamageAndBlacklist({ clientId, carId, damageCost, reason }) {
  ensureSupabase()

  const { error: damageError } = await supabase.from('damage_reports').insert({
    client_id: clientId,
    car_id: carId,
    damage_cost: Number(damageCost),
    notes: reason,
    reported_at: nowIsoDateTime(),
  })

  if (damageError) {
    throw damageError
  }

  const { error: blacklistError } = await supabase.from('blacklist_entries').insert({
    client_id: clientId,
    car_id: carId,
    reason,
    status: 'blacklisted',
    created_at: nowIsoDateTime(),
  })

  if (blacklistError) {
    throw blacklistError
  }

  const { error: clientStatusError } = await supabase
    .from('clients')
    .update({ status: 'blacklisted' })
    .eq('id', clientId)

  if (clientStatusError) {
    throw clientStatusError
  }
}
