'use client'

// ─── SHARED FORM HELPERS ──────────────────────────────────────────────────────

/** Text input — forces UPPERCASE on change (except email/password/special) */
export function TextInput({
  value, onChange, placeholder, className, disabled,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}) {
  return (
    <input
      type="text"
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value.toUpperCase())}
      className={className}
    />
  )
}

/** Phone input — national format (10 digits, no +52), auto-formats as XXX-XXX-XXXX */
export function PhoneInput({
  value, onChange, className,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  const format = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return (
    <input
      type="tel"
      value={value}
      onChange={e => onChange(format(e.target.value))}
      placeholder="55-1234-5678"
      maxLength={12}
      className={className}
    />
  )
}

/** Split name fields: Nombre(s) + Apellido(s) */
export function NombreApellidoFields({
  nombre, apellido, onNombre, onApellido, inputCls,
}: {
  nombre: string; apellido: string
  onNombre: (v: string) => void; onApellido: (v: string) => void
  inputCls: string
}) {
  return (
    <>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Nombre(s)<span className="text-red-500 ml-0.5">*</span></label>
        <input type="text" value={nombre} onChange={e => onNombre(e.target.value.toUpperCase())} placeholder="NOMBRE(S)" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Apellido(s)<span className="text-red-500 ml-0.5">*</span></label>
        <input type="text" value={apellido} onChange={e => onApellido(e.target.value.toUpperCase())} placeholder="APELLIDO(S)" className={inputCls} />
      </div>
    </>
  )
}

/** Split address fields */
export function DireccionFields({
  values, onChange, inputCls,
}: {
  values: { calle: string; numero: string; colonia: string; estado: string; cp: string }
  onChange: (field: keyof typeof values, v: string) => void
  inputCls: string
}) {
  return (
    <>
      <div className="col-span-2">
        <label className="block text-xs font-medium text-slate-500 mb-1">Calle</label>
        <input type="text" value={values.calle} onChange={e => onChange('calle', e.target.value.toUpperCase())} placeholder="NOMBRE DE LA CALLE" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Número</label>
        <input type="text" value={values.numero} onChange={e => onChange('numero', e.target.value.toUpperCase())} placeholder="EXT / INT" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Colonia</label>
        <input type="text" value={values.colonia} onChange={e => onChange('colonia', e.target.value.toUpperCase())} placeholder="COLONIA" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Estado</label>
        <input type="text" value={values.estado} onChange={e => onChange('estado', e.target.value.toUpperCase())} placeholder="ESTADO" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Código postal</label>
        <input type="text" value={values.cp} onChange={e => onChange('cp', e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="00000" maxLength={5} className={inputCls} />
      </div>
    </>
  )
}
