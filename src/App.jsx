import { useMemo, useState } from 'react'
import './App.css'

const locations = ['Nairobi', 'Mombasa', 'Nakuru', 'Kisumu', 'Eldoret']
const vehicles = ['Sedan', 'SUV', 'Mini Bus', 'Pickup Truck', 'Luxury']
const stepLabels = ['Trip details', 'Contact info', 'Review & confirm']

const today = new Date().toISOString().slice(0, 10)

function App() {
  const [activeStep, setActiveStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    pickupLocation: 'Nairobi',
    dropoffLocation: 'Nairobi',
    pickupDate: today,
    pickupTime: '09:00',
    returnDate: today,
    returnTime: '17:00',
    vehicleType: 'Sedan',
    driverRequired: 'No',
    fullName: '',
    email: '',
    phone: '',
    notes: '',
  })

  const canContinue = useMemo(() => {
    if (activeStep === 0) {
      return (
        form.pickupLocation &&
        form.dropoffLocation &&
        form.pickupDate &&
        form.returnDate &&
        form.pickupTime &&
        form.returnTime &&
        form.vehicleType
      )
    }

    if (activeStep === 1) {
      return form.fullName.trim() && form.email.trim() && form.phone.trim()
    }

    return true
  }, [activeStep, form])

  const progress = useMemo(() => {
    return ((activeStep / (stepLabels.length - 1)) * 100).toFixed(0)
  }, [activeStep])

  const handleChange = (field) => (event) => {
    const value = event.target.value
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleRadio = (value) => {
    setForm((current) => ({ ...current, driverRequired: value }))
  }

  const handleNext = () => {
    if (!canContinue || activeStep >= stepLabels.length - 1) return
    setActiveStep((current) => current + 1)
  }

  const handleBack = () => {
    if (activeStep === 0) return
    setActiveStep((current) => current - 1)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(true)
  }

  const handleReset = () => {
    setForm({
      pickupLocation: 'Nairobi',
      dropoffLocation: 'Nairobi',
      pickupDate: today,
      pickupTime: '09:00',
      returnDate: today,
      returnTime: '17:00',
      vehicleType: 'Sedan',
      driverRequired: 'No',
      fullName: '',
      email: '',
      phone: '',
      notes: '',
    })
    setActiveStep(0)
    setSubmitted(false)
  }

  const bookingSummary = useMemo(() => {
    return [
      { label: 'Pickup', value: `${form.pickupLocation} • ${form.pickupDate} @ ${form.pickupTime}` },
      { label: 'Return', value: `${form.dropoffLocation} • ${form.returnDate} @ ${form.returnTime}` },
      { label: 'Vehicle', value: form.vehicleType },
      { label: 'Driver required', value: form.driverRequired },
      { label: 'Traveler', value: form.fullName || 'Your name' },
      { label: 'Contact', value: form.email || 'Email address' },
    ]
  }, [form])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute right-0 top-24 h-[280px] w-[520px] rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 rounded-3xl border border-slate-700/80 bg-slate-900/70 px-4 py-3 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/20">
                S
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Speedo</p>
                <p className="font-semibold text-slate-100">Car hire solutions</p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
              <a className="transition hover:text-white" href="#booking">Book a ride</a>
              <a className="transition hover:text-white" href="#fleet">Fleet</a>
              <a className="transition hover:text-white" href="#support">Support</a>
              <a className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-cyan-200 transition hover:bg-cyan-500/15" href="#contact">Contact</a>
            </nav>
          </header>

          <main className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
            <section className="space-y-8">
              <div className="max-w-3xl space-y-6">
                <div className="inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
                  New customer booking
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                    Smooth car hire booking for every trip.
                  </h1>
                  <p className="max-w-2xl text-lg leading-8 text-slate-300">
                    Book the right vehicle in just a few steps. Choose pickup and dropoff locations, add your contact details, review the plan, and confirm your reservation quickly.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-800/90 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Available now</p>
                    <p className="mt-3 text-2xl font-semibold text-white">Sedans, SUVs, minibus</p>
                    <p className="mt-2 text-sm text-slate-400">Flexible dropoff and airport transfers available.</p>
                  </div>
                  <div className="rounded-3xl border border-slate-800/90 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Support</p>
                    <p className="mt-3 text-2xl font-semibold text-white">24/7 customer care</p>
                    <p className="mt-2 text-sm text-slate-400">Fast responses for bookings, changes, and driver requests.</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-8">
                <div className="mb-6 rounded-3xl border border-slate-700/80 bg-slate-950/80 p-6">
                  <div className="flex items-center justify-between gap-4 text-sm text-slate-400">
                    <span className="font-semibold uppercase tracking-[0.3em] text-cyan-300">Booking summary</span>
                    <span className="text-slate-500">Fast, secure, flexible</span>
                  </div>
                  <div className="mt-6 grid gap-4">
                    {bookingSummary.slice(0, 4).map((item) => (
                      <div key={item.label} className="rounded-3xl bg-slate-900/80 p-4">
                        <p className="text-sm text-slate-400">{item.label}</p>
                        <p className="mt-1 font-semibold text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-6">
                    <p className="text-sm text-slate-400">Pickup location</p>
                    <p className="mt-3 text-lg font-semibold text-white">{form.pickupLocation}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-6">
                    <p className="text-sm text-slate-400">Vehicle type</p>
                    <p className="mt-3 text-lg font-semibold text-white">{form.vehicleType}</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="booking" className="space-y-6">
              <div className="glass-card p-6 sm:p-8">
                <div className="mb-6">
                  <div className="mb-3 flex items-center justify-between gap-3 text-sm text-slate-400">
                    <span className="font-semibold uppercase tracking-[0.3em] text-cyan-300">Step {activeStep + 1}</span>
                    <span>{stepLabels[activeStep]}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {activeStep === 0 && (
                    <div className="space-y-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm text-slate-300">
                          Pickup location
                          <select value={form.pickupLocation} onChange={handleChange('pickupLocation')} className="mt-2 block w-full rounded-3xl border border-slate-700/90 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-cyan-400">
                            {locations.map((location) => (
                              <option key={location} value={location}>{location}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-sm text-slate-300">
                          Dropoff location
                          <select value={form.dropoffLocation} onChange={handleChange('dropoffLocation')} className="mt-2 block w-full rounded-3xl border border-slate-700/90 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-cyan-400">
                            {locations.map((location) => (
                              <option key={location} value={location}>{location}</option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm text-slate-300">
                          Pickup date
                          <input type="date" value={form.pickupDate} min={today} onChange={handleChange('pickupDate')} className="mt-2 block w-full rounded-3xl border border-slate-700/90 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-cyan-400" />
                        </label>
                        <label className="block text-sm text-slate-300">
                          Pickup time
                          <input type="time" value={form.pickupTime} onChange={handleChange('pickupTime')} className="mt-2 block w-full rounded-3xl border border-slate-700/90 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-cyan-400" />
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm text-slate-300">
                          Return date
                          <input type="date" value={form.returnDate} min={form.pickupDate} onChange={handleChange('returnDate')} className="mt-2 block w-full rounded-3xl border border-slate-700/90 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-cyan-400" />
                        </label>
                        <label className="block text-sm text-slate-300">
                          Return time
                          <input type="time" value={form.returnTime} onChange={handleChange('returnTime')} className="mt-2 block w-full rounded-3xl border border-slate-700/90 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-cyan-400" />
                        </label>
                      </div>

                      <label className="block text-sm text-slate-300">
                        Vehicle type
                        <select value={form.vehicleType} onChange={handleChange('vehicleType')} className="mt-2 block w-full rounded-3xl border border-slate-700/90 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-cyan-400">
                          {vehicles.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </label>

                      <div className="space-y-3">
                        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Driver required?</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {['No', 'Yes'].map((option) => (
                            <button type="button" key={option} onClick={() => handleRadio(option)} className={
                              `rounded-3xl border px-4 py-3 text-left transition ${form.driverRequired === option ? 'border-cyan-400 bg-cyan-500/10 text-white' : 'border-slate-700/90 bg-slate-900/90 text-slate-300 hover:border-slate-500'}`
                            }>
                              <span className="block text-sm font-semibold">{option}</span>
                              <span className="mt-1 block text-xs text-slate-400">{option === 'Yes' ? 'Includes chauffeur service' : 'Self-drive only'}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStep === 1 && (
                    <div className="space-y-5">
                      <label className="block text-sm text-slate-300">
                        Full name
                        <input type="text" value={form.fullName} onChange={handleChange('fullName')} placeholder="John Doe" className="mt-2 block w-full rounded-3xl border border-slate-700/90 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-cyan-400" />
                      </label>
                      <label className="block text-sm text-slate-300">
                        Email address
                        <input type="email" value={form.email} onChange={handleChange('email')} placeholder="you@example.com" className="mt-2 block w-full rounded-3xl border border-slate-700/90 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-cyan-400" />
                      </label>
                      <label className="block text-sm text-slate-300">
                        Phone number
                        <input type="tel" value={form.phone} onChange={handleChange('phone')} placeholder="+254 700 000 000" className="mt-2 block w-full rounded-3xl border border-slate-700/90 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-cyan-400" />
                      </label>
                      <label className="block text-sm text-slate-300">
                        Additional notes
                        <textarea value={form.notes} onChange={handleChange('notes')} placeholder="Any special requests or pickup instructions" rows="4" className="mt-2 block w-full rounded-3xl border border-slate-700/90 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-cyan-400" />
                      </label>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div className="space-y-5 rounded-3xl border border-slate-700/90 bg-slate-900/90 p-5">
                      <div className="space-y-4">
                        {bookingSummary.map((item) => (
                          <div key={item.label} className="flex items-start justify-between gap-4">
                            <p className="text-sm text-slate-400">{item.label}</p>
                            <p className="max-w-[60%] text-sm font-semibold text-white text-right">{item.value}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm leading-6 text-slate-400">Review your trip details carefully before confirming. We will reach out to finalize availability and vehicle allocation.</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-3">
                      <button type="button" onClick={handleBack} disabled={activeStep === 0} className="inline-flex items-center justify-center rounded-3xl border border-slate-700/90 bg-slate-900/90 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50">
                        Back
                      </button>
                      {activeStep < stepLabels.length - 1 ? (
                        <button type="button" onClick={handleNext} disabled={!canContinue} className="inline-flex items-center justify-center rounded-3xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50">
                          Continue
                        </button>
                      ) : (
                        <button type="submit" disabled={!canContinue} className="inline-flex items-center justify-center rounded-3xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50">
                          Confirm booking
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{activeStep === 2 ? 'Confirm to finish' : 'Step-by-step booking flow'}</p>
                  </div>
                </form>
              </div>

              <div className="glass-card p-6 sm:p-8">
                {submitted ? (
                  <div className="space-y-5">
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">
                      Booking request sent
                    </div>
                    <h2 className="text-2xl font-semibold text-white">Thank you, {form.fullName || 'traveler'}.</h2>
                    <p className="text-slate-400">Your car hire request is on its way. A member of our team will contact you shortly to confirm your vehicle and pickup details.</p>
                    <div className="grid gap-3 rounded-3xl bg-slate-900/90 p-4 text-sm text-slate-300">
                      <div className="flex items-center justify-between border-b border-slate-800/70 pb-3">
                        <span>Pickup</span>
                        <span>{form.pickupLocation}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-800/70 pb-3 pt-3">
                        <span>Vehicle</span>
                        <span>{form.vehicleType}</span>
                      </div>
                      <div className="flex items-center justify-between pt-3">
                        <span>Driver</span>
                        <span>{form.driverRequired}</span>
                      </div>
                    </div>
                    <button type="button" onClick={handleReset} className="w-full rounded-3xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                      Book another ride
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <h2 className="text-2xl font-semibold text-white">Need help with your booking?</h2>
                    <p className="text-slate-400">Our team can help with custom routes, airport pickups, or long-term car hire. We keep the process fast and clear.</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-3xl border border-slate-700/90 bg-slate-900/90 p-4">
                        <p className="text-sm text-slate-400">Response time</p>
                        <p className="mt-2 font-semibold text-white">Under 15 minutes</p>
                      </div>
                      <div className="rounded-3xl border border-slate-700/90 bg-slate-900/90 p-4">
                        <p className="text-sm text-slate-400">Support</p>
                        <p className="mt-2 font-semibold text-white">24/7 booking support</p>
                      </div>
                    </div>
                    <div className="rounded-3xl border border-slate-700/90 bg-slate-900/90 p-4">
                      <p className="text-sm text-slate-400">Ready to start?</p>
                      <p className="mt-2 text-white">Complete the form and we’ll take care of the rest.</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}

export default App
