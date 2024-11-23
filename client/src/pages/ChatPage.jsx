// src/pages/ChatPage.jsx
import { Layout } from "@/components/common/Layout";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatPage() {
  return (
    <Layout>
      <div className="container max-w-4xl">
        <ChatInterface />
      </div>
    </Layout>
  );
}