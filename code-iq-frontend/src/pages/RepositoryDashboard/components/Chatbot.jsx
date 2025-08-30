import styles from "./Chatbot.module.css";
import { Bot } from "lucide-react";

function Chatbot() {
//   const [chatMessages, setChatMessages] = useState([
//     {
//       type: "assistant",
//       content:
//         "Welcome to your codebase intelligence assistant! I can help you understand your code health metrics, navigate files, and provide insights about your repository.",
//       timestamp: new Date(),
//     },
//   ]);
//   const [chatInput, setChatInput] = useState("");

//   // Chat handlers
//   const handleChatSubmit = (e) => {
//     e.preventDefault();
//     if (!chatInput.trim()) return;

//     const userMessage = {
//       type: "user",
//       content: chatInput,
//       timestamp: new Date(),
//     };
//     const assistantResponse = {
//       type: "assistant",
//       content: generateContextualResponse(chatInput),
//       timestamp: new Date(),
//     };

//     setChatMessages((prev) => [...prev, userMessage, assistantResponse]);
//     setChatInput("");
//   };

//   const generateContextualResponse = (input) => {
//     const context = getContextualInfo();

//     if (input.toLowerCase().includes("score")) {
//       return `Based on your current ${activeWorkspaceView} view, I can see your repository has a health score of ${repository?.healthScore?.toFixed(
//         1
//       )}, security score of ${repository?.securityScore?.toFixed(
//         1
//       )}, and knowledge score of ${repository?.knowledgeScore?.toFixed(
//         1
//       )}. ${context}`;
//     }

//     if (input.toLowerCase().includes("file")) {
//       return `You're currently viewing ${
//         fileSnapshots.length
//       } analyzed files. ${
//         selectedFile
//           ? `The selected file "${
//               selectedFile.filePath
//             }" has scores: Health ${formatScore(
//               selectedFile.healthScore
//             )}, Security ${formatScore(
//               selectedFile.securityScore
//             )}, Knowledge ${formatScore(selectedFile.knowledgeScore)}.`
//           : "Click on any file to see detailed metrics."
//       } ${context}`;
//     }

//     if (input.toLowerCase().includes("scan")) {
//       const recentScan = activeScans[0];
//       return `Your latest scan shows ${recentScan?.status} status. You have ${
//         activeScans.filter((s) => s.status === "completed").length
//       } completed scans and ${
//         activeScans.filter((s) => s.status === "running").length
//       } currently running. ${context}`;
//     }

//     return `I'm analyzing your "${repository?.name}" repository. Currently viewing: ${activeWorkspaceView}. ${context} How can I help you understand your codebase better?`;
//   };

//   const getContextualInfo = () => {
//     switch (activeWorkspaceView) {
//       case "dashboard":
//         return `Focus area: Overall repository health analysis with ${scoreFilter} score filtering.`;
//       case "files":
//         return `Focus area: File-level analysis of ${fileSnapshots.length} files.`;
//       case "scans":
//         return `Focus area: Scan history and monitoring.`;
//       case "settings":
//         return `Focus area: Repository configuration and preferences.`;
//       default:
//         return "Exploring repository metrics and insights.";
//     }
//   };

  return (
    <div className={styles.chatPanel}>
      <div className={styles.chatHeader}>
        <h3>
          <Bot size={18} /> Codebase Assistant
        </h3>
        {/* <div className={styles.chatContext}>
          <span className={styles.contextLabel}>Context:</span>
          <span className={styles.contextValue}>
            {activeWorkspaceView === "dashboard"
              ? `${repository?.name} Overview`
              : activeWorkspaceView === "files"
              ? `Files${selectedFile ? ` - ${selectedFile.filePath}` : ""}`
              : "Scan History"}
          </span>
        </div> */}
      </div>

      <div className={styles.chatMessages}>
        {/* {chatMessages.map((message, index) => (
          <div
            key={index}
            className={`${styles.message} ${styles[message.type]}`}
          >
            <div className={styles.messageContent}>{message.content}</div>
            <div className={styles.messageTime}>
              {message.timestamp.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))} */}
        Chatbot coming soon!
      </div>

      {/* <form onSubmit={handleChatSubmit} className={styles.chatInput}>
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Ask about your codebase..."
          className={styles.chatInputField}
        />
        <button type="submit" className={styles.chatSendBtn}>
          Send
        </button>
      </form> */}
    </div>
  );
}

export default Chatbot;
