import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Overview from "./pages/Overview";
import CampusPage from "./pages/CampusPage";
import CentralHub from "./pages/CentralHub";
import EvaluationResults from "./pages/EvaluationResults";

export default function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route
            path="/campus-1"
            element={<CampusPage key="1" id="1" port="5001" />}
          />
          <Route
            path="/campus-2"
            element={<CampusPage key="2" id="2" port="5002" />}
          />
          <Route path="/main" element={<CentralHub />} />
          <Route path="/evaluation" element={<EvaluationResults />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}
