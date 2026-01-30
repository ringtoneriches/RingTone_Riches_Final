import maintenanceDsk from "../../../attached_assets/Maintainence/maintainceDsk.jpeg";
import maintenanceMbl from "../../../attached_assets/Maintainence/maintainceMbl.jpeg";

export default function MaintenancePage() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-black">
      
      {/* Desktop Image */}
      <img
        src={maintenanceDsk}
        alt="Maintenance Desktop"
        className="hidden md:block w-full h-full object-cover"
      />

      {/* Mobile Image */}
      <img
        src={maintenanceMbl}
        alt="Maintenance Mobile"
        className="block md:hidden w-full h-full object-cover"
      />

    </div>
  );
}
