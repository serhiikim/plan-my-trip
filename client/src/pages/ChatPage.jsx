// src/pages/ChatPage.jsx
import { Layout } from "@/components/common/Layout";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatPage() {
  return (
    <Layout>
      <div className="container">
        <ChatInterface />
      </div>
    </Layout>
  );
}