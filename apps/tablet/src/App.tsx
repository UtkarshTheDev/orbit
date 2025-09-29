import RobotFace from "./components/RobotFace";

function App() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-0 text-foreground">
      {/* Full-screen face only */}
      <RobotFace />
    </main>
  );
}

export default App;
