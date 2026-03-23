import React, { useMemo, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import {  Permission, User } from "../../types";
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
  effectiveDate: string;
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

 const { items: users } = useCrud<User>({ endpoint: "/users" });

  const userById = useMemo(() => {
  const map = new Map<number, User>();
  users.forEach((u) => map.set(u.id, u));
  return map;
}, [users]);
const handleOfferUserChange = (id: string) => {
  const user = userById.get(Number(id));

  if (user) {
    setOffer({
      employeeId: id,
      employeeName: user.name || "",
      address: user.address || "",   // optional (you don’t have in model)
      position: user.position || "",
      joiningDate: user.joining_date || "",
      salaryMonthly: user.salary_monthly
        ? String(user.salary_monthly)
        : "",
      department: user.department_name || "", // or user.department if string
    });
  } else {
    // reset if no user selected
    setOffer({
      employeeId: "",
      employeeName: "",
      address: "",
      position: "",
      joiningDate: "",
      salaryMonthly: "",
      department: "",
    });
  }
};

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
    effectiveDate: "",
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

  const [errors, setErrors] = useState<any>({});

  const validateOffer = () => {
    let e: any = {};
    if (!offer.employeeId && !offer.employeeName?.trim()) e.employee = "Please select employee or enter employee name";
    if (!offer.department?.trim()) e.department = "Department is required";
    if (!offer.position?.trim()) e.position = "Position is required";
    if (!offer.joiningDate) e.joiningDate = "Joining date is required";
    else if (new Date(offer.joiningDate) > new Date()) e.joiningDate = "Joining date cannot be in the future";
    if (!offer.salaryMonthly || Number(offer.salaryMonthly) <= 0) e.salaryMonthly = "Monthly salary must be greater than 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const selectedAppraisalEmployee = appraisal.employeeId
    ? userById.get(Number(appraisal.employeeId))
    : undefined;
  
  const validateAppraisal = () => {
    let e: any = {};
    if (!appraisal.employeeId) e.employeeId = "Please select employee or enter employee name";
    if (!selectedAppraisalEmployee?.salary_monthly) e.currentSalary = "Current salary is required";
    if (!appraisal.increasePercentage || Number(appraisal.increasePercentage) <= 0) e.newSalary = "New salary must be greater than current salary";
    if (!appraisal.effectiveDate) e.effectiveDate = "Effective date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateExperience = () => {
    let e: any = {};
    if (!experience.employeeId) e.employeeId = "Please select employee or enter employee name";
    if (!experience.role?.trim()) e.position = "Position is required";
    if (!experience.startDate) e.joiningDate = "Joining date is required";
    if (!experience.endDate) e.endDate = "Experience text/description required"; 
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const selectedSalaryEmployee = salaryCert.employeeId
    ? userById.get(Number(salaryCert.employeeId))
    : undefined;

  const validateSalary = () => {
    let e: any = {};
    if (!salaryCert.employeeId) e.employeeId = "Please select employee or enter employee name";
    if (!selectedSalaryEmployee?.department_name) e.department = "Department is required";
    if (!selectedSalaryEmployee?.position) e.position = "Position is required";
    if (!selectedSalaryEmployee?.salary_monthly || Number(selectedSalaryEmployee.salary_monthly) <= 0) e.salaryMonthly = "Monthly salary must be greater than 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const computedNewSalary = useMemo(() => {
    if (!selectedAppraisalEmployee) return "";
    const pct = Number(appraisal.increasePercentage || 0);
    const oldSalary = Number(selectedAppraisalEmployee.salary_monthly || 0);
    if (!pct || !oldSalary) return "";
    return (oldSalary * (1 + pct / 100)).toFixed(2);
  }, [selectedAppraisalEmployee, appraisal.increasePercentage]);


  const postPdf = async (url: string, payload: any, filename: string) => {
    try {
      const res = await axiosInstance.post(url, payload, { responseType: "blob" });
      const blobURL = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = blobURL;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobURL);
    } catch(err) {
      console.error(err);
      alert("Failed to generate document.");
    }
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
              noValidate
              onChange={(e: any) => { if(errors[e.target.name]) setErrors({...errors, [e.target.name]: null}); }}
              onSubmit={async (e) => {
                e.preventDefault();
                if (!validateOffer()) return;
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
                    onChange={(e) => handleOfferUserChange(e.target.value)}
                  >
                    <option value="">-- Select employee --</option>
                    {users.map((user) => (
  <option key={user.id} value={user.id}>
    {user.name} ({user.email})
  </option>
))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold small">Employee Name</label>
                  <input
                    name="employee"
                    className={`form-control ${errors.employee ? 'is-invalid' : ''}`}
                    value={offer.employeeName}
                    onChange={(e) =>
                      setOffer((p) => ({ ...p, employeeName: e.target.value }))
                    }
                  />
                  {errors.employee && <div className="invalid-feedback">{errors.employee}</div>}
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold small">Department *</label>
                  <input
                    name="department"
                    className={`form-control ${errors.department ? 'is-invalid' : ''}`}
                    value={offer.department}
                    onChange={(e) =>
                      setOffer((p) => ({ ...p, department: e.target.value }))
                    }
                  />
                  {errors.department && <div className="invalid-feedback">{errors.department}</div>}
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold small">Address</label>
                  <input
                    name="address"
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
                    name="position"
                    className={`form-control ${errors.position ? 'is-invalid' : ''}`}
                    value={offer.position}
                    onChange={(e) =>
                      setOffer((p) => ({ ...p, position: e.target.value }))
                    }
                  />
                  {errors.position && <div className="invalid-feedback">{errors.position}</div>}
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold small">Joining Date *</label>
                  <input
                    name="joiningDate"
                    type="date"
                    className={`form-control ${errors.joiningDate ? 'is-invalid' : ''}`}
                    value={offer.joiningDate}
                    onChange={(e) =>
                      setOffer((p) => ({ ...p, joiningDate: e.target.value }))
                    }
                  />
                  {errors.joiningDate && <div className="invalid-feedback">{errors.joiningDate}</div>}
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold small">Monthly Salary *</label>
                  <input
                    name="salaryMonthly"
                    type="number"
                    className={`form-control ${errors.salaryMonthly ? 'is-invalid' : ''}`}
                    value={offer.salaryMonthly}
                    onChange={(e) =>
                      setOffer((p) => ({ ...p, salaryMonthly: e.target.value }))
                    }
                  />
                  {errors.salaryMonthly && <div className="invalid-feedback">{errors.salaryMonthly}</div>}
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
              noValidate
              onChange={(e: any) => { if(errors[e.target.name]) setErrors({...errors, [e.target.name]: null}); }}
              onSubmit={async (e) => {
                e.preventDefault();
                if (!validateAppraisal()) return;
                await postPdf(
                  "/hr-documents/appraisal-letter/",
                  {
                    employee_id: Number(appraisal.employeeId),
                    increase_percentage: Number(appraisal.increasePercentage),
                    effective_date: appraisal.effectiveDate,
                  },
                  "appraisal_letter.pdf"
                );
              }}
            >
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Employee *</label>
                  <select
                    name="employeeId"
                    className={`form-select ${errors.employeeId ? 'is-invalid' : ''}`}
                    value={appraisal.employeeId}
                    onChange={(e) =>
                      setAppraisal((p) => ({ ...p, employeeId: e.target.value }))
                    }
                  >
                    <option value="">-- Select employee --</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                  {errors.employeeId && <div className="invalid-feedback">{errors.employeeId}</div>}
                  {errors.currentSalary && <div className="text-danger small mt-1">{errors.currentSalary}</div>}
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold small">Increase % *</label>
                  <input
                    name="newSalary"
                    type="number"
                    className={`form-control ${errors.newSalary ? 'is-invalid' : ''}`}
                    value={appraisal.increasePercentage}
                    onChange={(e) =>
                      setAppraisal((p) => ({
                        ...p,
                        increasePercentage: e.target.value,
                      }))
                    }
                  />
                  {errors.newSalary && <div className="invalid-feedback">{errors.newSalary}</div>}
                  {computedNewSalary && (
                    <div className="small text-secondary mt-1">
                      New: <span className="fw-bold">{computedNewSalary}</span>
                    </div>
                  )}
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold small">Effective Date *</label>
                  <input
                    name="effectiveDate"
                    type="date"
                    className={`form-control ${errors.effectiveDate ? 'is-invalid' : ''}`}
                    value={appraisal.effectiveDate}
                    onChange={(e) =>
                      setAppraisal((p) => ({
                        ...p,
                        effectiveDate: e.target.value,
                      }))
                    }
                  />
                  {errors.effectiveDate && <div className="invalid-feedback">{errors.effectiveDate}</div>}
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
              noValidate
              onChange={(e: any) => { if(errors[e.target.name]) setErrors({...errors, [e.target.name]: null}); }}
              onSubmit={async (e) => {
                e.preventDefault();
                if (!validateExperience()) return;
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
                    name="employeeId"
                    className={`form-select ${errors.employeeId ? 'is-invalid' : ''}`}
                    value={experience.employeeId}
                    onChange={(e) =>
                      setExperience((p) => ({ ...p, employeeId: e.target.value }))
                    }
                  >
                    <option value="">-- Select employee --</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                  {errors.employeeId && <div className="invalid-feedback">{errors.employeeId}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Role *</label>
                  <input
                    name="position"
                    className={`form-control ${errors.position ? 'is-invalid' : ''}`}
                    value={experience.role}
                    onChange={(e) =>
                      setExperience((p) => ({ ...p, role: e.target.value }))
                    }
                    placeholder="SEO, Software Development, Digital Marketing..."
                  />
                  {errors.position && <div className="invalid-feedback">{errors.position}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Start Date *</label>
                  <input
                    name="joiningDate"
                    type="date"
                    className={`form-control ${errors.joiningDate ? 'is-invalid' : ''}`}
                    value={experience.startDate}
                    onChange={(e) =>
                      setExperience((p) => ({ ...p, startDate: e.target.value }))
                    }
                  />
                  {errors.joiningDate && <div className="invalid-feedback">{errors.joiningDate}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">End Date *</label>
                  <input
                    name="endDate"
                    type="date"
                    className={`form-control ${errors.endDate ? 'is-invalid' : ''}`}
                    value={experience.endDate}
                    onChange={(e) =>
                      setExperience((p) => ({ ...p, endDate: e.target.value }))
                    }
                  />
                  {errors.endDate && <div className="invalid-feedback">{errors.endDate}</div>}
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
              noValidate
              onChange={(e: any) => { if(errors[e.target.name]) setErrors({...errors, [e.target.name]: null}); }}
              onSubmit={async (e) => {
                e.preventDefault();
                if (!validateSalary()) return;
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
                    name="employeeId"
                    className={`form-select ${errors.employeeId ? 'is-invalid' : ''}`}
                    value={salaryCert.employeeId}
                    onChange={(e) =>
                      setSalaryCert((p) => ({ ...p, employeeId: e.target.value }))
                    }
                  >
                    <option value="">-- Select employee --</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                  {errors.employeeId && <div className="invalid-feedback">{errors.employeeId}</div>}
                  {(errors.department || errors.position || errors.salaryMonthly) && (
                    <div className="text-danger small mt-1">
                      {errors.department || errors.position || errors.salaryMonthly}
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Company Name *</label>
                  <input
                    name="companyName"
                    className="form-control"
                    value={salaryCert.companyName}
                    onChange={(e) =>
                      setSalaryCert((p) => ({ ...p, companyName: e.target.value }))
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Issue Date *</label>
                  <input
                    name="issueDate"
                    type="date"
                    className={`form-control ${errors.issueDate ? 'is-invalid' : ''}`}
                    value={salaryCert.issueDate}
                    onChange={(e) =>
                      setSalaryCert((p) => ({ ...p, issueDate: e.target.value }))
                    }
                  />
                  {errors.issueDate && <div className="invalid-feedback">{errors.issueDate}</div>}
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

