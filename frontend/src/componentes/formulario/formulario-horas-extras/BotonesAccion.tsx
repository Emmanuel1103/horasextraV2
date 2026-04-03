import { Button } from "@/components/ui/button";
import { Send, AlertCircle } from "lucide-react";
import type { ViewMode } from "@/types";

interface BotonesAccionProps {
  mode: ViewMode;
  isFormValid: () => boolean;
  getText: (key: string, defaultValue?: string) => string;
}

export const BotonesAccion = ({
  mode,
  isFormValid,
  getText
}: BotonesAccionProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
      <Button
        type="submit"
        disabled={!isFormValid()}
        className={`flex-1 h-12 text-base font-medium transition-colors ${
          isFormValid()
            ? "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        {mode === "colaborador" ? (
          <>
            <Send className="mr-2 h-5 w-5" />
            {getText("BUTTON_SEND_APPROVAL", "Enviar a aprobación")}
          </>
        ) : (
          <>
            <AlertCircle className="mr-2 h-5 w-5" />
            {getText("BUTTON_SAVE", "Guardar registro")}
          </>
        )}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="h-12 px-8 text-base font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
      >
        {getText("BUTTON_CANCEL", "Cancelar")}
      </Button>
    </div>
  );
};