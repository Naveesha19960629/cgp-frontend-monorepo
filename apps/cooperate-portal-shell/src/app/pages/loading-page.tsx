export default function LoadingPage() {
  const oxoLogo = import.meta.env.VITE_PORTAL_LOGO || '/oxo_careers_logo.svg';

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-white px-4"
      style={{
        backgroundImage: 'url(/images/error_background.svg)',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="relative">
        <div>
          <div className="absolute top-6 left-6 z-0 h-30 w-30 animate-ping rounded-full bg-[linear-gradient(130deg,rgba(243,115,46,0.29)_-15.49%,#fff_185.6%)]"></div>
          <div className="h-41.5 w-41.5 rounded-full bg-[linear-gradient(130deg,rgba(243,115,46,0.29)_-15.49%,#fff_185.6%)]"></div>
        </div>
        <img
          src="/images/loading-avatar.svg"
          alt="error avatar"
          className="absolute top-4 left-4 z-10 h-33.5 w-33.5 rounded-full"
        />
      </div>
      <img
        src={oxoLogo}
        alt={'Oxo Careers Logo'}
        className="mt-12 h-11.5 w-83.5"
      />
      <div className="mt-13.5 flex items-center justify-center gap-1.5">
        <span className="sr-only">Loading...</span>
        <div
          className="bg-brand-primary-500 size-2 animate-bounce rounded-full"
          style={{ animationDelay: '0ms' }}
        ></div>
        <div
          className="size-2 animate-bounce rounded-full bg-[#CA9239]"
          style={{ animationDelay: '150ms' }}
        ></div>
        <div
          className="bg-brand-primary-500 size-2 animate-bounce rounded-full"
          style={{ animationDelay: '300ms' }}
        ></div>
      </div>
    </div>
  );
}
