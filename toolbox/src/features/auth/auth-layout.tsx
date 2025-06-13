interface Props {
  children: React.ReactNode
}

export default function AuthLayout({ children }: Props) {
  return (
    <div
      className="relative h-screen overflow-hidden bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/images/online-Tangram-Dallas-Showroom.jpg')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/50"></div>
      <div className="relative flex items-center justify-center h-full px-4 sm:px-8">
        {children}
      </div>
    </div>
  )
}
