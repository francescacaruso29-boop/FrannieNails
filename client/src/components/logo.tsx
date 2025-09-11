import logoImage from "@assets/logo_1755550131172.png";

export function FrannieLogo() {
  return (
    <div className="relative inline-block mb-8">
      <div className="text-center">
        <img 
          src={logoImage} 
          alt="Frannie Nails Logo" 
          className="h-auto mx-auto"
          style={{
            width: '98vw',
            minWidth: '600px',
            maxWidth: 'none',
            height: 'auto',
            filter: 'drop-shadow(4px 4px 8px rgba(0,0,0,0.3))'
          }}
        />
      </div>
    </div>
  );
}
