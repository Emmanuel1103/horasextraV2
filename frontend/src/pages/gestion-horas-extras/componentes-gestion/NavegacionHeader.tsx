import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTextLabels } from "@/contexts/TextLabelsContext";

export const NavegacionHeader = () => {
  const navigate = useNavigate();
  const { textLabels } = useTextLabels();

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => {
          navigate("/reporte-horas-extras");
        }}
        style={{ 
          color: "rgba(255,255,255,0.7)", 
          fontSize: "0.9375rem" 
        }}
      >
        {textLabels.MODULE_OVERTIME || "Reporte de horas extras"}
      </Button>
      <Button
        variant="ghost"
        style={{ 
          color: "white", 
          fontSize: "0.9375rem", 
          fontWeight: "600" 
        }}
      >
        {textLabels.MODULE_NOMINA || "Gestión de horas extras"}
      </Button>
    </>
  );
};