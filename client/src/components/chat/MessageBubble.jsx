import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function MessageBubble({ message }) {
  const isAssistant = message.type === 'assistant';

  return (
    <div className={cn(
      "flex gap-3",
      isAssistant ? "self-start" : "self-end flex-row-reverse"
    )}>
      <div className={cn(
        "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow",
        isAssistant ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        {isAssistant ? (
          <Bot className="h-4 w-4" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </div>
      <div className={cn(
        "rounded-lg px-4 py-2 shadow-sm max-w-[80%]",
        isAssistant 
          ? "bg-background border" 
          : "bg-primary text-primary-foreground"
      )}>
        <p className="text-sm leading-relaxed">
          {message.content}
        </p>
        {message.timestamp && (
          <time className={cn(
            "text-[10px] select-none mt-1 block",
            isAssistant ? "text-muted-foreground" : "text-primary-foreground/80"
          )}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </time>
        )}
      </div>
    </div>
  );
}