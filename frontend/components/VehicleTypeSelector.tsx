"use client";

import { Button } from "@/components/ui/button";
import { Car, Bike, Bus } from "lucide-react";

interface VehicleTypeSelectorProps {
  vehicleType: string;
  onVehicleTypeChange: (vehicleType: string) => void;
}

export function VehicleTypeSelector({
  vehicleType,
  onVehicleTypeChange,
}: VehicleTypeSelectorProps) {
  return (
    <div className="mb-4 pointer-events-auto flex justify-end items-center gap-2">
      <Button
        variant={vehicleType === "auto" ? "default" : "outline"}
        onClick={() => onVehicleTypeChange("auto")}
        className="rounded-full backdrop-blur-sm"
      >
        <Car className="mr-2 h-4 w-4" />
        Automóvil
      </Button>
      <Button
        variant={vehicleType === "moto" ? "default" : "outline"}
        onClick={() => onVehicleTypeChange("moto")}
        className="rounded-full backdrop-blur-sm"
      >
        <Bike className="mr-2 h-4 w-4" />
        Moto
      </Button>
      <Button
        variant={vehicleType === "bus" ? "default" : "outline"}
        onClick={() => onVehicleTypeChange("bus")}
        className="rounded-full backdrop-blur-sm"
      >
        <Bus className="mr-2 h-4 w-4" />
        Bus
      </Button>
    </div>
  );
}