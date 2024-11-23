// src/components/common/DateRangePicker.jsx
import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DateRangePicker({ onSelect }) {
  const [date, setDate] = React.useState({
    from: undefined,
    to: undefined
  });

  const handleSelect = (selectedDate) => {
    setDate(selectedDate || { from: undefined, to: undefined });
    if (selectedDate?.from && selectedDate?.to) {
      const formattedFrom = format(selectedDate.from, 'dd/MM/yyyy');
      const formattedTo = format(selectedDate.to, 'dd/MM/yyyy');
      onSelect(`${formattedFrom} - ${formattedTo}`);
    }
  };

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick start & end dates</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={new Date()}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={(date) => date < new Date()}
            footer={<p className="text-sm text-center p-2 text-muted-foreground">Please select start & end dates</p>}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}