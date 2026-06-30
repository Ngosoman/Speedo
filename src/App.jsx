import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { addDaysToDate, todayIsoDate } from './lib/date'
import { hasSupabaseConfig } from './lib/supabaseClient'
import {
  createCar,
  createDamageAndBlacklist,
  getBookings,
  getLookupData,
  submitBooking,
  updateBookingDetails,
  updateBookingStatus,
  updateCarPrice,
  upsertOwner,
} from './services/api'

const locations = ['Nairobi', 'Mombasa', 'Nakuru', 'Kisumu', 'Eldoret']

const inspectionChecklistGroups = [
  {
    title: 'Tools and Safety',
    items: [
      { key: 's_wheel', label: 'S/Wheel' },
      { key: 'jack', label: 'Jack' },
      { key: 'wheel_spinner', label: 'W/ Spinner' },
      { key: 'lifesaver', label: 'Lifesaver' },
      { key: 'first_aid_kit', label: 'First Aid Kit' },
      { key: 'fire_extinguisher', label: 'Fire Extinguisher' },
      { key: 'alarm', label: 'Alarm' },
      { key: 'jumper_cables', label: 'Jumper Cables' },
      { key: 'towel', label: 'Towel' },
      { key: 'tow_rope', label: 'Tow Rope' },
    ],
  },
  {
    title: 'Body and Exterior',
    items: [
      { key: 'front_windscreen', label: 'Front Windscreen' },
      { key: 'rear_windscreen', label: 'Rear Windscreen' },
      { key: 'mudguard_front_right', label: 'Mudguard Front Right' },
      { key: 'mudguard_front_left', label: 'Mudguard Front Left' },
      { key: 'mudguard_rear_right', label: 'Mudguard Rear Right' },
      { key: 'mudguard_rear_left', label: 'Mudguard Rear Left' },
    ],
  },
  {
    title: 'Engine Bay',
    items: [
      { key: 'engine', label: 'Engine' },
      { key: 'oil_cap', label: 'Oil Cap' },
      { key: 'water_cap', label: 'Water Cap' },
      { key: 'radiator', label: 'Radiator' },
    ],
  },
  {
    title: 'Windows',
    items: [
      { key: 'window_front_right', label: 'Front Right' },
      { key: 'window_front_left', label: 'Front Left' },
      { key: 'window_rear_right', label: 'Rear Right' },
      { key: 'window_rear_left', label: 'Rear Left' },
    ],
  },
  {
    title: 'Wheel Caps',
    items: [
      { key: 'wheelcap_front_right', label: 'Front Right' },
      { key: 'wheelcap_front_left', label: 'Front Left' },
      { key: 'wheelcap_rear_right', label: 'Rear Right' },
      { key: 'wheelcap_rear_left', label: 'Rear Left' },
    ],
  },
  {
    title: 'Interior and Audio',
    items: [
      { key: 'floormat_normal', label: 'Floormat Normal' },
      { key: 'floormat_plastics', label: 'Floormat Plastics' },
      { key: 'speaker_front', label: 'Speakers Front' },
      { key: 'speaker_rear', label: 'Speakers Rear' },
      { key: 'cd_changer', label: 'CD Changer' },
      { key: 'cd_player', label: 'CD Player' },
    ],
  },
  {
    title: 'Special and Other',
    items: [
      { key: 'spanner_no_10', label: 'Spanner No. 10' },
      { key: 'special_nut', label: 'Special Nut' },
      { key: 'others', label: 'Others' },
    ],
  },
]

const inspectionChecklistKeys = inspectionChecklistGroups.flatMap((group) =>
  group.items.map((item) => item.key),
)

function initialBookingForm() {
  return {
    pickup_location: 'Nairobi',
    dropoff_location: 'Nairobi',
    pickup_date: todayIsoDate(),
    pickup_time: '09:00',
    return_time: '17:00',
    number_of_days: 1,
    driver_required: 'No',
    car_id: '',
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    license_number: '',
    license_expiry: todayIsoDate(),
    residential_address: '',
    work_address: '',
    kra_pin: '',
    car_checklist: {},
    notes: '',
  }
}

function initialOwnerForm() {
  return {
    name: '',
    phone: '',
    email: '',
  }
}

function initialCarForm() {
  return {
    name: '',
    model: '',
    owner_id: '',
    daily_price: '',
    photoFile: null,
  }
}

function initialBlacklistForm() {
  return {
    client_id: '',
    car_id: '',
    damage_cost: '',
    reason: '',
  }
}

function formatCurrency(value) {
  const numberValue = Number(value || 0)
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(numberValue)
}

function formatDate(dateText) {
  if (!dateText) return '-'
  return new Date(dateText).toLocaleString()
}

function toDateInputText(value) {
  if (!value) return todayIsoDate()
  return value.slice(0, 10)
}

function toTimeInputText(value) {
  if (!value) return '09:00'
  const timePart = value.split('T')[1] || ''
  return timePart.slice(0, 5)
}

function parseBookingNotes(rawNotes) {
  if (!rawNotes) {
    return {
      clientNotes: '',
      checklist: {},
    }
  }

  try {
    const parsed = JSON.parse(rawNotes)
    return {
      clientNotes: typeof parsed?.clientNotes === 'string' ? parsed.clientNotes : '',
      checklist: parsed?.checklist && typeof parsed.checklist === 'object' ? parsed.checklist : {},
    }
  } catch {
    return {
      clientNotes: rawNotes,
      checklist: {},
    }
  }
}

function BookingEditor({ booking, cars, onSave }) {
  const [draft, setDraft] = useState({
    pickup_location: booking.pickup_location,
    dropoff_location: booking.dropoff_location,
    pickup_date: toDateInputText(booking.pickup_datetime),
    pickup_time: toTimeInputText(booking.pickup_datetime),
    return_time: toTimeInputText(booking.return_datetime),
    number_of_days: booking.number_of_days,
    car_id: booking.car_id,
  })

  const computedReturn = useMemo(() => {
    return addDaysToDate(draft.pickup_date, draft.number_of_days)
  }, [draft.pickup_date, draft.number_of_days])

  const handleChange = (field) => (event) => {
    const value = event.target.value
    setDraft((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-700 bg-slate-900/80 p-4 sm:grid-cols-3">
      <label className="text-xs text-slate-300">
        Pickup
        <select className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2" value={draft.pickup_location} onChange={handleChange('pickup_location')}>
          {locations.map((location) => (
            <option key={location} value={location}>{location}</option>
          ))}
        </select>
      </label>
      <label className="text-xs text-slate-300">
        Dropoff
        <select className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2" value={draft.dropoff_location} onChange={handleChange('dropoff_location')}>
          {locations.map((location) => (
            <option key={location} value={location}>{location}</option>
          ))}
        </select>
      </label>
      <label className="text-xs text-slate-300">
        Car
        <select className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2" value={draft.car_id} onChange={handleChange('car_id')}>
          {cars.map((car) => (
            <option key={car.id} value={car.id}>{car.name} - {formatCurrency(car.daily_price)}</option>
          ))}
        </select>
      </label>
      <label className="text-xs text-slate-300">
        Pickup date
        <input type="date" className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2" value={draft.pickup_date} onChange={handleChange('pickup_date')} />
      </label>
      <label className="text-xs text-slate-300">
        Pickup time
        <input type="time" className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2" value={draft.pickup_time} onChange={handleChange('pickup_time')} />
      </label>
      <label className="text-xs text-slate-300">
        Return time
        <input type="time" className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2" value={draft.return_time} onChange={handleChange('return_time')} />
      </label>
      <label className="text-xs text-slate-300">
        Days
        <input min="1" type="number" className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2" value={draft.number_of_days} onChange={handleChange('number_of_days')} />
      </label>
      <div className="text-xs text-slate-300">
        Auto return date
        <div className="mt-1 rounded-xl bg-slate-800 px-3 py-2">{computedReturn}</div>
      </div>
      <div className="flex items-end">
        <button type="button" onClick={() => onSave(draft)} className="w-full rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">
          Save booking edit
        </button>
      </div>
    </div>
  )
}

function App() {
  const [mode, setMode] = useState('client')
  const [adminTab, setAdminTab] = useState('bookings')
  const [bookingForm, setBookingForm] = useState(initialBookingForm())
  const [ownerForm, setOwnerForm] = useState(initialOwnerForm())
  const [carForm, setCarForm] = useState(initialCarForm())
  const [blacklistForm, setBlacklistForm] = useState(initialBlacklistForm())

  const [cars, setCars] = useState([])
  const [owners, setOwners] = useState([])
  const [clients, setClients] = useState([])
  const [bookings, setBookings] = useState([])

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingBookingId, setEditingBookingId] = useState('')
  const [bookingNotes, setBookingNotes] = useState({})
  const [priceDrafts, setPriceDrafts] = useState({})

  const returnDate = useMemo(() => {
    return addDaysToDate(bookingForm.pickup_date, bookingForm.number_of_days)
  }, [bookingForm.pickup_date, bookingForm.number_of_days])

  const checkedInspectionCount = useMemo(() => {
    return Object.values(bookingForm.car_checklist || {}).filter(Boolean).length
  }, [bookingForm.car_checklist])

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setError('Supabase config missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local and restart app.')
      return
    }

    refreshAllData()
  }, [])

  async function refreshAllData() {
    setLoading(true)
    setError('')
    try {
      const [lookup, latestBookings] = await Promise.all([getLookupData(), getBookings()])
      setCars(lookup.cars)
      setOwners(lookup.owners)
      setClients(lookup.clients)
      setBookings(latestBookings)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedCar = useMemo(() => {
    return cars.find((car) => car.id === bookingForm.car_id) || null
  }, [cars, bookingForm.car_id])

  function handleBookingChange(field) {
    return (event) => {
      const value = event.target.value
      setBookingForm((current) => ({ ...current, [field]: value }))
    }
  }

  function handleChecklistToggle(itemKey) {
    setBookingForm((current) => ({
      ...current,
      car_checklist: {
        ...current.car_checklist,
        [itemKey]: !current.car_checklist?.[itemKey],
      },
    }))
  }

  function setAllChecklistItems(value) {
    const nextChecklist = {}
    for (const key of inspectionChecklistKeys) {
      nextChecklist[key] = value
    }

    setBookingForm((current) => ({
      ...current,
      car_checklist: nextChecklist,
    }))
  }

  async function handleClientSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const created = await submitBooking(bookingForm)
      setMessage(`Booking submitted and waiting admin approval. Booking ref: ${created.id}`)
      setBookingForm(initialBookingForm())
      await refreshAllData()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateOwner(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      await upsertOwner(ownerForm)
      setOwnerForm(initialOwnerForm())
      setMessage('Owner saved successfully.')
      await refreshAllData()
    } catch (ownerError) {
      setError(ownerError.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCar(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      await createCar(carForm)
      setCarForm(initialCarForm())
      setMessage('Car uploaded and available in booking form.')
      await refreshAllData()
    } catch (carError) {
      setError(carError.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(bookingId, status) {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      await updateBookingStatus({
        bookingId,
        status,
        adminNotes: bookingNotes[bookingId] || '',
      })
      setMessage(
        status === 'approved'
          ? 'Booking approved. Admin-client and admin-owner contracts generated.'
          : 'Booking status updated.',
      )
      await refreshAllData()
    } catch (statusError) {
      setError(statusError.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveBookingEdit(bookingId, draft) {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      await updateBookingDetails({ bookingId, updates: draft })
      setMessage('Booking edited successfully.')
      setEditingBookingId('')
      await refreshAllData()
    } catch (editError) {
      setError(editError.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateCarPrice(carId) {
    const newPrice = priceDrafts[carId]
    if (!newPrice) return

    setLoading(true)
    setError('')
    setMessage('')

    try {
      await updateCarPrice(carId, newPrice)
      setMessage('Car price updated.')
      await refreshAllData()
    } catch (priceError) {
      setError(priceError.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleBlacklist(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      await createDamageAndBlacklist({
        clientId: blacklistForm.client_id,
        carId: blacklistForm.car_id,
        damageCost: blacklistForm.damage_cost,
        reason: blacklistForm.reason,
      })
      setBlacklistForm(initialBlacklistForm())
      setMessage('Client and car have been flagged and blacklisted with damage cost.')
      await refreshAllData()
    } catch (blacklistError) {
      setError(blacklistError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-slate-700 bg-slate-900/90 p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Speedo Platform</p>
              <h1 className="mt-2 text-3xl font-semibold">Client booking and Admin operations</h1>
              <p className="mt-2 text-sm text-slate-400">Supabase-backed workflow for bookings, approvals, blacklist, cars, owners, and contracts.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => setMode('client')} className={`rounded-2xl px-4 py-2 text-sm font-semibold ${mode === 'client' ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-200'}`}>
                Client portal
              </button>
              <button type="button" onClick={() => setMode('admin')} className={`rounded-2xl px-4 py-2 text-sm font-semibold ${mode === 'admin' ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-200'}`}>
                Admin panel
              </button>
            </div>
          </div>
        </header>

        {error && <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}
        {message && <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">{message}</div>}

        {mode === 'client' && (
          <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <form onSubmit={handleClientSubmit} className="space-y-5 rounded-3xl border border-slate-700 bg-slate-900/90 p-6">
              <h2 className="text-xl font-semibold">Client booking form</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm">
                  Pickup location
                  <select className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={bookingForm.pickup_location} onChange={handleBookingChange('pickup_location')}>
                    {locations.map((location) => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  Dropoff location
                  <select className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={bookingForm.dropoff_location} onChange={handleBookingChange('dropoff_location')}>
                    {locations.map((location) => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm">
                  Pickup date (editable)
                  <input min={todayIsoDate()} type="date" className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={bookingForm.pickup_date} onChange={handleBookingChange('pickup_date')} />
                </label>
                <label className="text-sm">
                  Pickup time
                  <input type="time" className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={bookingForm.pickup_time} onChange={handleBookingChange('pickup_time')} />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="text-sm">
                  Number of days
                  <input min="1" type="number" className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={bookingForm.number_of_days} onChange={handleBookingChange('number_of_days')} />
                </label>
                <label className="text-sm">
                  Return time
                  <input type="time" className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={bookingForm.return_time} onChange={handleBookingChange('return_time')} />
                </label>
                <label className="text-sm">
                  Return date (auto)
                  <input readOnly type="date" className="mt-2 w-full rounded-2xl bg-slate-700 px-4 py-3" value={returnDate} />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm">
                  Car option
                  <select className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={bookingForm.car_id} onChange={handleBookingChange('car_id')} required>
                    <option value="">Select car</option>
                    {cars.map((car) => (
                      <option key={car.id} value={car.id}>{car.name} - {formatCurrency(car.daily_price)}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  Driver required
                  <select className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={bookingForm.driver_required} onChange={handleBookingChange('driver_required')}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm">
                  Full name
                  <input className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={bookingForm.full_name} onChange={handleBookingChange('full_name')} required />
                </label>
                <label className="text-sm">
                  Email
                  <input type="email" className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={bookingForm.email} onChange={handleBookingChange('email')} required />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm">
                  Phone
                  <input className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={bookingForm.phone} onChange={handleBookingChange('phone')} required />
                </label>
                <label className="text-sm">
                  Date of birth
                  <input type="date" className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={bookingForm.date_of_birth} onChange={handleBookingChange('date_of_birth')} />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm">
                  License number
                  <input className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={bookingForm.license_number} onChange={handleBookingChange('license_number')} />
                </label>
                <label className="text-sm">
                  License expiry
                  <input type="date" className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={bookingForm.license_expiry} onChange={handleBookingChange('license_expiry')} />
                </label>
              </div>

              <label className="text-sm block">
                Residential address
                <input className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={bookingForm.residential_address} onChange={handleBookingChange('residential_address')} />
              </label>
              <label className="text-sm block">
                Work address
                <input className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={bookingForm.work_address} onChange={handleBookingChange('work_address')} />
              </label>
              <label className="text-sm block">
                KRA PIN
                <input className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={bookingForm.kra_pin} onChange={handleBookingChange('kra_pin')} />
              </label>

              <section className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">Car inspection checklist</h3>
                    <p className="text-sm text-slate-400">Tick every item after physically checking the car with the admin team.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="rounded-full bg-slate-800 px-3 py-1 text-xs text-cyan-200">
                      {checkedInspectionCount}/{inspectionChecklistKeys.length} checked
                    </p>
                    <button type="button" onClick={() => setAllChecklistItems(true)} className="rounded-xl bg-slate-700 px-3 py-1 text-xs font-semibold">
                      Mark all
                    </button>
                    <button type="button" onClick={() => setAllChecklistItems(false)} className="rounded-xl bg-slate-700 px-3 py-1 text-xs font-semibold">
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {inspectionChecklistGroups.map((group) => (
                    <fieldset key={group.title} className="rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
                      <legend className="px-1 text-sm font-semibold text-cyan-200">{group.title}</legend>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {group.items.map((item) => {
                          const checked = Boolean(bookingForm.car_checklist?.[item.key])
                          return (
                            <label
                              key={item.key}
                              className={`flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${checked ? 'bg-cyan-500/20 text-cyan-100' : 'bg-slate-900/70 text-slate-300'}`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleChecklistToggle(item.key)}
                                className="h-4 w-4 accent-cyan-400"
                              />
                              <span>{item.label}</span>
                            </label>
                          )
                        })}
                      </div>
                    </fieldset>
                  ))}
                </div>
              </section>

              <label className="text-sm block">
                Notes
                <textarea rows="3" className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={bookingForm.notes} onChange={handleBookingChange('notes')} />
              </label>

              <button disabled={loading || !hasSupabaseConfig} className="w-full rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50" type="submit">
                Submit booking for admin approval
              </button>
            </form>

            <aside className="space-y-4 rounded-3xl border border-slate-700 bg-slate-900/90 p-6">
              <h3 className="text-lg font-semibold">Booking preview</h3>
              <div className="rounded-2xl bg-slate-800/80 p-4 text-sm">
                <p className="text-slate-400">Car</p>
                <p className="font-semibold">{selectedCar ? `${selectedCar.name} (${formatCurrency(selectedCar.daily_price)}/day)` : 'Choose a car'}</p>
              </div>
              <div className="rounded-2xl bg-slate-800/80 p-4 text-sm">
                <p className="text-slate-400">Client return rule</p>
                <p className="font-semibold">Return date is auto-calculated from pickup date + number of days.</p>
              </div>
              <div className="rounded-2xl bg-slate-800/80 p-4 text-sm">
                <p className="text-slate-400">Approval flow</p>
                <p className="font-semibold">Booking stays pending until admin approves and contracts are generated.</p>
              </div>
            </aside>
          </section>
        )}

        {mode === 'admin' && (
          <section className="space-y-6">
            <div className="grid gap-2 sm:grid-cols-5">
              {[
                { id: 'bookings', label: 'Bookings' },
                { id: 'cars', label: 'Cars' },
                { id: 'owners', label: 'Owners' },
                { id: 'clients', label: 'Clients' },
                { id: 'blacklist', label: 'Blacklist' },
              ].map((tab) => (
                <button key={tab.id} type="button" onClick={() => setAdminTab(tab.id)} className={`rounded-2xl px-4 py-2 text-sm font-semibold ${adminTab === tab.id ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-200'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {adminTab === 'bookings' && (
              <div className="space-y-4 rounded-3xl border border-slate-700 bg-slate-900/90 p-6">
                <h2 className="text-xl font-semibold">Bookings queue</h2>
                {bookings.length === 0 && <p className="text-slate-400">No bookings submitted yet.</p>}
                {bookings.map((booking) => (
                  (() => {
                    const details = parseBookingNotes(booking.notes)
                    const checkedItems = inspectionChecklistGroups
                      .flatMap((group) =>
                        group.items
                          .filter((item) => Boolean(details.checklist?.[item.key]))
                          .map((item) => item.label),
                      )

                    return (
                  <article key={booking.id} className="space-y-3 rounded-2xl border border-slate-700 bg-slate-900 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-400">Booking ID</p>
                        <p className="font-semibold">{booking.id}</p>
                        <p className="text-sm text-slate-300">
                          Client {booking.clients?.client_code || '-'} - {booking.clients?.full_name || '-'}
                        </p>
                        <p className="text-sm text-slate-300">Car: {booking.cars?.name || '-'} ({formatCurrency(booking.cars?.daily_price)}/day)</p>
                      </div>
                      <div className="text-right">
                        <p className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-wider text-cyan-200">{booking.status}</p>
                        <p className="mt-2 text-xs text-slate-400">Submitted: {formatDate(booking.submitted_at)}</p>
                      </div>
                    </div>

                    <p className="text-sm text-slate-300">Pickup: {booking.pickup_location} | Dropoff: {booking.dropoff_location}</p>
                    <p className="text-sm text-slate-300">From: {formatDate(booking.pickup_datetime)} | To: {formatDate(booking.return_datetime)} | Days: {booking.number_of_days}</p>
                    {details.clientNotes ? (
                      <p className="text-sm text-slate-300">Client notes: {details.clientNotes}</p>
                    ) : null}
                    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-sm">
                      <p className="font-semibold text-cyan-200">Inspection checklist</p>
                      <p className="mt-1 text-slate-300">
                        {checkedItems.length} item(s) checked.
                      </p>
                      {checkedItems.length > 0 ? (
                        <p className="mt-2 text-xs text-slate-400">
                          {checkedItems.join(', ')}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-slate-500">No checklist items were ticked by the client.</p>
                      )}
                    </div>

                    <textarea
                      rows="2"
                      placeholder="Admin notes"
                      value={bookingNotes[booking.id] || booking.admin_notes || ''}
                      onChange={(event) =>
                        setBookingNotes((current) => ({
                          ...current,
                          [booking.id]: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl bg-slate-800 px-3 py-2 text-sm"
                    />

                    {editingBookingId === booking.id ? (
                      <BookingEditor
                        booking={booking}
                        cars={cars}
                        onSave={(draft) => handleSaveBookingEdit(booking.id, draft)}
                      />
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setEditingBookingId((current) => (current === booking.id ? '' : booking.id))} className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold">
                        {editingBookingId === booking.id ? 'Close edit' : 'Edit booking'}
                      </button>
                      <button type="button" onClick={() => handleApprove(booking.id, 'approved')} className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950">
                        Approve
                      </button>
                      <button type="button" onClick={() => handleApprove(booking.id, 'rejected')} className="rounded-xl bg-rose-400 px-4 py-2 text-sm font-semibold text-slate-950">
                        Reject
                      </button>
                    </div>

                    {Array.isArray(booking.contracts) && booking.contracts.length > 0 && (
                      <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/5 p-3 text-sm text-emerald-200">
                        Contracts: {booking.contracts.map((contract) => contract.contract_type).join(', ')}
                      </div>
                    )}
                  </article>
                    )
                  })()
                ))}
              </div>
            )}

            {adminTab === 'cars' && (
              <div className="grid gap-5 lg:grid-cols-2">
                <form onSubmit={handleCreateCar} className="space-y-4 rounded-3xl border border-slate-700 bg-slate-900/90 p-6">
                  <h2 className="text-xl font-semibold">Upload car</h2>
                  <label className="text-sm block">
                    Car name
                    <input required className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={carForm.name} onChange={(event) => setCarForm((current) => ({ ...current, name: event.target.value }))} />
                  </label>
                  <label className="text-sm block">
                    Model
                    <input className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={carForm.model} onChange={(event) => setCarForm((current) => ({ ...current, model: event.target.value }))} />
                  </label>
                  <label className="text-sm block">
                    Owner
                    <select required className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={carForm.owner_id} onChange={(event) => setCarForm((current) => ({ ...current, owner_id: event.target.value }))}>
                      <option value="">Select owner</option>
                      {owners.map((owner) => (
                        <option key={owner.id} value={owner.id}>{owner.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm block">
                    Daily price (editable later)
                    <input required min="0" type="number" className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={carForm.daily_price} onChange={(event) => setCarForm((current) => ({ ...current, daily_price: event.target.value }))} />
                  </label>
                  <label className="text-sm block">
                    Photo (gallery or take photo)
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3"
                      onChange={(event) =>
                        setCarForm((current) => ({
                          ...current,
                          photoFile: event.target.files?.[0] || null,
                        }))
                      }
                    />
                  </label>
                  <button disabled={loading} type="submit" className="w-full rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50">
                    Upload car
                  </button>
                </form>

                <div className="space-y-3 rounded-3xl border border-slate-700 bg-slate-900/90 p-6">
                  <h2 className="text-xl font-semibold">Cars and pricing</h2>
                  {cars.map((car) => (
                    <article key={car.id} className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{car.name}</p>
                          <p className="text-sm text-slate-400">{car.model || 'No model'} | {formatCurrency(car.daily_price)}</p>
                        </div>
                        {car.photo_url ? <img src={car.photo_url} alt={car.name} className="h-14 w-20 rounded-lg object-cover" /> : null}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <input
                          min="0"
                          type="number"
                          placeholder="New price"
                          className="w-full rounded-xl bg-slate-800 px-3 py-2 text-sm"
                          value={priceDrafts[car.id] || ''}
                          onChange={(event) =>
                            setPriceDrafts((current) => ({
                              ...current,
                              [car.id]: event.target.value,
                            }))
                          }
                        />
                        <button type="button" onClick={() => handleUpdateCarPrice(car.id)} className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950">
                          Save
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {adminTab === 'owners' && (
              <div className="grid gap-5 lg:grid-cols-2">
                <form onSubmit={handleCreateOwner} className="space-y-4 rounded-3xl border border-slate-700 bg-slate-900/90 p-6">
                  <h2 className="text-xl font-semibold">Owner management</h2>
                  <label className="text-sm block">
                    Name
                    <input required className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={ownerForm.name} onChange={(event) => setOwnerForm((current) => ({ ...current, name: event.target.value }))} />
                  </label>
                  <label className="text-sm block">
                    Phone
                    <input className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={ownerForm.phone} onChange={(event) => setOwnerForm((current) => ({ ...current, phone: event.target.value }))} />
                  </label>
                  <label className="text-sm block">
                    Email
                    <input type="email" className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={ownerForm.email} onChange={(event) => setOwnerForm((current) => ({ ...current, email: event.target.value }))} />
                  </label>
                  <button disabled={loading} type="submit" className="w-full rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50">
                    Save owner
                  </button>
                </form>

                <div className="space-y-3 rounded-3xl border border-slate-700 bg-slate-900/90 p-6">
                  <h2 className="text-xl font-semibold">Owner list</h2>
                  {owners.map((owner) => (
                    <article key={owner.id} className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                      <p className="font-semibold">{owner.name}</p>
                      <p className="text-sm text-slate-400">{owner.phone || '-'} | {owner.email || '-'}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {adminTab === 'clients' && (
              <div className="space-y-3 rounded-3xl border border-slate-700 bg-slate-900/90 p-6">
                <h2 className="text-xl font-semibold">Client list</h2>
                {clients.map((client) => (
                  <article key={client.id} className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold">{client.client_code} - {client.full_name}</p>
                      <p className={`rounded-full px-3 py-1 text-xs uppercase tracking-wider ${client.status === 'blacklisted' ? 'bg-rose-500/20 text-rose-200' : 'bg-emerald-500/20 text-emerald-200'}`}>
                        {client.status}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{client.email} | {client.phone}</p>
                  </article>
                ))}
              </div>
            )}

            {adminTab === 'blacklist' && (
              <form onSubmit={handleBlacklist} className="space-y-4 rounded-3xl border border-slate-700 bg-slate-900/90 p-6">
                <h2 className="text-xl font-semibold">Flag / blacklist by damage cost</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm block">
                    Client
                    <select required className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={blacklistForm.client_id} onChange={(event) => setBlacklistForm((current) => ({ ...current, client_id: event.target.value }))}>
                      <option value="">Select client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>{client.client_code} - {client.full_name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm block">
                    Car
                    <select required className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={blacklistForm.car_id} onChange={(event) => setBlacklistForm((current) => ({ ...current, car_id: event.target.value }))}>
                      <option value="">Select car</option>
                      {cars.map((car) => (
                        <option key={car.id} value={car.id}>{car.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="text-sm block">
                  Damage cost
                  <input required min="0" type="number" className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={blacklistForm.damage_cost} onChange={(event) => setBlacklistForm((current) => ({ ...current, damage_cost: event.target.value }))} />
                </label>
                <label className="text-sm block">
                  Reason / notes
                  <textarea required rows="3" className="mt-2 w-full rounded-2xl bg-slate-800 px-4 py-3" value={blacklistForm.reason} onChange={(event) => setBlacklistForm((current) => ({ ...current, reason: event.target.value }))} />
                </label>
                <button disabled={loading} type="submit" className="w-full rounded-2xl bg-rose-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50">
                  Flag and blacklist
                </button>
              </form>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

export default App
