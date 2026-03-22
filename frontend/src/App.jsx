import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Overview from "./pages/Overview";
import CampusPage from "./pages/CampusPage";
import CentralHub from "./pages/CentralHub";
import EvaluationResults from "./pages/EvaluationResults";

function AppContent() {
  const location = useLocation();

  const isCampus1 = location.pathname === "/campus-1";
  const isCampus2 = location.pathname === "/campus-2";
  const isOtherRoute = !isCampus1 && !isCampus2;

  return (
    <AppLayout>
      <div
        className="main-content-wrapper"
        style={{ width: "100%", height: "100%" }}
      >
        <div style={{ display: isOtherRoute ? "block" : "none" }}>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/main" element={<CentralHub />} />
            <Route path="/evaluation" element={<EvaluationResults />} />
          </Routes>
        </div>

        <div style={{ display: isCampus1 ? "block" : "none", height: "100%" }}>
          <CampusPage key="1" id="1" port="5001" />
        </div>

        <div style={{ display: isCampus2 ? "block" : "none", height: "100%" }}>
          <CampusPage key="2" id="2" port="5002" />
        </div>
      </div>
    </AppLayout>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
