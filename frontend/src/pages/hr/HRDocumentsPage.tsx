import React, { useMemo, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { Employee, Permission } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useCrud } from "../../hooks/useCrud";
import { downloadBlob } from "../../utils/download";

type OfferForm = {
  employeeId: string;
  employeeName: string;
  address: string;
  position: string;
  joiningDate: string;
  salaryMonthly: string;
  department: string;
};

type AppraisalForm = {
  employeeId: string;
  increasePercentage: string;
};

type ExperienceForm = {
  employeeId: string;
  role: string;
  startDate: string;
  endDate: string;
};

type SalaryCertForm = {
  employeeId: string;
  companyName: string;
  issueDate: string;
};

const HRDocumentsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canGenerate = hasPermission(Permission.GENERATE_HR_DOCS);

  const { items: employees } = useCrud<Employee>({ endpoint: "/employees" });

  const employeeById = useMemo(() => {
    const map = new Map<number, Employee>();
    employees.forEach((e) => map.set(e.id, e));
    return map;
  }, [employees]);

  const [activeTab, setActiveTab] = useState<
    "offer" | "appraisal" | "experience" | "salary"
  >("offer");

  const [offer, setOffer] = useState<OfferForm>({
    employeeId: "",
    employeeName: "",
    address: "",
    position: "",
    joiningDate: "",
    salaryMonthly: "",
    department: "",
  });

  const [appraisal, setAppraisal] = useState<AppraisalForm>({
    employeeId: "",
    increasePercentage: "",
  });

  const [experience, setExperience] = useState<ExperienceForm>({
    employeeId: "",
    role: "",
    startDate: "",
    endDate: "",
  });

  const [salaryCert, setSalaryCert] = useState<SalaryCertForm>({
    employeeId: "",
    companyName: "GREHASOFT",
    issueDate: "",
  });

  const selectedAppraisalEmployee = appraisal.employeeId
    ? employeeById.get(Number(appraisal.employeeId))
    : undefined;
  const computedNewSalary = useMemo(() => {
    if (!selectedAppraisalEmployee) return "";
    const pct = Number(appraisal.increasePercentage || 0);
    const oldSalary = Number(selectedAppraisalEmployee.salary_monthly || 0);
    if (!pct || !oldSalary) return "";
    return (oldSalary * (1 + pct / 100)).toFixed(2);
  }, [selectedAppraisalEmployee, appraisal.increasePercentage]);

  const selectedSalaryEmployee = salaryCert.employeeId
    ? employeeById.get(Number(salaryCert.employeeId))
    : undefined;

  const postPdf = async (url: string, payload: any, filename: string) => {
    const res = await axiosInstance.post(url, payload, { responseType: "blob" });
    downloadBlob(filename, res.data);
  };

  if (!canGenerate) {
    return (
      <div className="container-fluid p-0">
        <div className="alert alert-warning mb-0">
          You do not have permission to generate HR documents.
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">HR Document Automation</h3>
          <p className="text-secondary small mb-0">
            Generate HR PDFs using employee data
          </p>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "offer" ? "active" : ""}`}
                onClick={() => setActiveTab("offer")}
                type="button"
              >
                Offer Letter
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "appraisal" ? "active" : ""
                }`}
                onClick={() => setActiveTab("appraisal")}
                type="button"
              >
                Salary Appraisal
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "experience" ? "active" : ""
                }`}
                onClick={() => setActiveTab("experience")}
                type="button"
              >
                Experience Certificate
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "salary" ? "active" : ""}`}
                onClick={() => setActiveTab("salary")}
                type="button"
              >
                Salary Certificate
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body">
          {activeTab === "offer" && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const payload: any = {
                  employee_id: offer.employeeId ? Number(offer.employeeId) : undefined,
                  employee_name: offer.employeeName || undefined,
                  address: offer.address || undefined,
                  position: offer.position,
                  joining_date: offer.joiningDate,
                  salary_monthly: Number(offer.salaryMonthly),
                  department: offer.department,
                };
                await postPdf(
                  "/hr-documents/offer-letter/",
                  payload,
                  "offer_letter.pdf"
                );
              }}
            >
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-bold small">Employee (optional)</label>
                  <select
                    className="form-select"
                    value={offer.employeeId}
                    onChange={(e) =>
                      setOffer((p) => ({ ...p, employeeId: e.target.value }))
                    }
                  >
                    <option value="">-- Select employee --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        #{emp.id} (User: {emp.user})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold small">Employee Name</label>
                  <input
                    className="form-control"
                    value={offer.employeeName}
                    onChange={(e) =>
                      setOffer((p) => ({ ...p, employeeName: e.target.value }))
                    }
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold small">Department *</label>
                  <input
                    className="form-control"
                    required
                    value={offer.department}
                    onChange={(e) =>
                      setOffer((p) => ({ ...p, department: e.target.value }))
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold small">Address</label>
                  <input
                    className="form-control"
                    value={offer.address}
                    onChange={(e) =>
                      setOffer((p) => ({ ...p, address: e.target.value }))
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold small">Position *</label>
                  <input
                    className="form-control"
                    required
                    value={offer.position}
                    onChange={(e) =>
                      setOffer((p) => ({ ...p, position: e.target.value }))
                    }
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold small">Joining Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={offer.joiningDate}
                    onChange={(e) =>
                      setOffer((p) => ({ ...p, joiningDate: e.target.value }))
                    }
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold small">Monthly Salary *</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={offer.salaryMonthly}
                    onChange={(e) =>
                      setOffer((p) => ({ ...p, salaryMonthly: e.target.value }))
                    }
                  />
                </div>

                <div className="col-12">
                  <button className="btn btn-primary fw-bold" type="submit">
                    Download Offer Letter PDF
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === "appraisal" && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await postPdf(
                  "/hr-documents/appraisal-letter/",
                  {
                    employee_id: Number(appraisal.employeeId),
                    increase_percentage: Number(appraisal.increasePercentage),
                  },
                  "appraisal_letter.pdf"
                );
              }}
            >
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Employee *</label>
                  <select
                    className="form-select"
                    required
                    value={appraisal.employeeId}
                    onChange={(e) =>
                      setAppraisal((p) => ({ ...p, employeeId: e.target.value }))
                    }
                  >
                    <option value="">-- Select employee --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        #{emp.id} (User: {emp.user})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Increase % *</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={appraisal.increasePercentage}
                    onChange={(e) =>
                      setAppraisal((p) => ({
                        ...p,
                        increasePercentage: e.target.value,
                      }))
                    }
                  />
                  {computedNewSalary && (
                    <div className="small text-secondary mt-1">
                      New salary (approx): <span className="fw-bold">{computedNewSalary}</span>
                    </div>
                  )}
                </div>
                <div className="col-12">
                  <button className="btn btn-primary fw-bold" type="submit">
                    Download Appraisal Letter PDF
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === "experience" && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await postPdf(
                  "/hr-documents/experience-certificate/",
                  {
                    employee_id: Number(experience.employeeId),
                    role: experience.role,
                    start_date: experience.startDate,
                    end_date: experience.endDate,
                  },
                  "experience_certificate.pdf"
                );
              }}
            >
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Employee *</label>
                  <select
                    className="form-select"
                    required
                    value={experience.employeeId}
                    onChange={(e) =>
                      setExperience((p) => ({ ...p, employeeId: e.target.value }))
                    }
                  >
                    <option value="">-- Select employee --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        #{emp.id} (User: {emp.user})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Role *</label>
                  <input
                    className="form-control"
                    required
                    value={experience.role}
                    onChange={(e) =>
                      setExperience((p) => ({ ...p, role: e.target.value }))
                    }
                    placeholder="SEO, Software Development, Digital Marketing..."
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Start Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={experience.startDate}
                    onChange={(e) =>
                      setExperience((p) => ({ ...p, startDate: e.target.value }))
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">End Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={experience.endDate}
                    onChange={(e) =>
                      setExperience((p) => ({ ...p, endDate: e.target.value }))
                    }
                  />
                </div>
                <div className="col-12">
                  <button className="btn btn-primary fw-bold" type="submit">
                    Download Experience Certificate PDF
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === "salary" && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await postPdf(
                  "/hr-documents/salary-certificate/",
                  {
                    employee_id: Number(salaryCert.employeeId),
                    company_name: salaryCert.companyName,
                    issue_date: salaryCert.issueDate,
                  },
                  "salary_certificate.pdf"
                );
              }}
            >
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Employee *</label>
                  <select
                    className="form-select"
                    required
                    value={salaryCert.employeeId}
                    onChange={(e) =>
                      setSalaryCert((p) => ({ ...p, employeeId: e.target.value }))
                    }
                  >
                    <option value="">-- Select employee --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        #{emp.id} (User: {emp.user})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Company Name *</label>
                  <input
                    className="form-control"
                    required
                    value={salaryCert.companyName}
                    onChange={(e) =>
                      setSalaryCert((p) => ({ ...p, companyName: e.target.value }))
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Issue Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={salaryCert.issueDate}
                    onChange={(e) =>
                      setSalaryCert((p) => ({ ...p, issueDate: e.target.value }))
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Preview</label>
                  <div className="border rounded p-2 bg-light small">
                    <div><span className="fw-bold">Position:</span> {selectedSalaryEmployee?.position || "—"}</div>
                    <div><span className="fw-bold">Joining:</span> {selectedSalaryEmployee?.joining_date || "—"}</div>
                    <div><span className="fw-bold">Monthly:</span> {String(selectedSalaryEmployee?.salary_monthly ?? "—")}</div>
                  </div>
                </div>
                <div className="col-12">
                  <button className="btn btn-primary fw-bold" type="submit">
                    Download Salary Certificate PDF
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRDocumentsPage;

