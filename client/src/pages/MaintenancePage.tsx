import maintenance from "../../../attached_assets/maintainence.jpeg"

export default function MaintenancePage() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-black">
      <img 
        src={maintenance}
        alt="Maintenance"
        className="w-full max-w-xl h-full"
      />
    </div>
  );
}
