// src/components/common/FlightDateTimePicker.jsx
import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function FlightDateTimePicker({ onSelect }) {
  const [arrival, setArrival] = React.useState({
    date: undefined,
    time: undefined
  });
  const [departure, setDeparture] = React.useState({
    date: undefined,
    time: undefined
  });

  // Generate time options (every 30 minutes)
  const timeOptions = React.useMemo(() => {
    const times = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour = h.toString().padStart(2, '0');
        const minute = m.toString().padStart(2, '0');
        times.push(`${hour}:${minute}`);
      }
    }
    return times;
  }, []);

  const handleComplete = () => {
    if (arrival.date && arrival.time && departure.date && departure.time) {
      const formattedArrival = `${format(arrival.date, 'dd/MM/yyyy')} ${arrival.time}`;
      const formattedDeparture = `${format(departure.date, 'dd/MM/yyyy')} ${departure.time}`;
      onSelect(`Arrival: ${formattedArrival}\nDeparture: ${formattedDeparture}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Arrival Section */}
      <div className="space-y-2">
        <div className="font-medium text-sm">Arrival</div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !arrival.date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {arrival.date ? format(arrival.date, "LLL dd, y") : <span>Pick arrival date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={arrival.date}
                onSelect={(date) => {
                  setArrival(prev => ({ ...prev, date }));
                }}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Select
            value={arrival.time}
            onValueChange={(time) => {
              setArrival(prev => ({ ...prev, time }));
            }}
          >
            <SelectTrigger className="w-[140px]">
              <Clock className="mr-2 h-4 w-4" />
              {arrival.time || "Time"}
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Departure Section */}
      <div className="space-y-2">
        <div className="font-medium text-sm">Departure</div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !departure.date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {departure.date ? format(departure.date, "LLL dd, y") : <span>Pick departure date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={departure.date}
                onSelect={(date) => {
                  setDeparture(prev => ({ ...prev, date }));
                }}
                disabled={(date) => date < (arrival.date || new Date())}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Select
            value={departure.time}
            onValueChange={(time) => {
              setDeparture(prev => ({ ...prev, time }));
            }}
          >
            <SelectTrigger className="w-[140px]">
              <Clock className="mr-2 h-4 w-4" />
              {departure.time || "Time"}
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        className="w-full"
        onClick={handleComplete}
        disabled={!arrival.date || !arrival.time || !departure.date || !departure.time}
      >
        Confirm Flight Times
      </Button>
    </div>
  );
}