export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
};

export type SessionOut = {
  id: string;
  email: string;
  role: string;
  email_verified: boolean;
};

export type PatientProfileInput = {
  name?: string;
  date_of_birth?: string;
  sex_at_birth?: string;
  conditions?: string;
  allergies?: string;
  location_region?: string;
  insurance_status?: string;
};

export type PatientProfileOut = {
  patient_id: string;
};

export type ReportUploadInput = {
  patient_id: string;
  file_name: string;
  content_type: string;
  report_text?: string;
  storage_url?: string;
};

export type ReportUploadOut = {
  id: string;
  patient_id: string;
  file_name: string;
  status: string;
};

export type ReportAnalysisOut = {
  id: string;
  report_id: string;
  patient_id: string;
  risk_level: string;
  status: string;
  summary: Record<string, unknown>;
  recommendations: Record<string, unknown>;
};

export type LabTrendInput = {
  patient_id: string;
  report_id?: string | null;
  test_name: string;
  value: string;
  unit?: string;
  observed_on?: string;
  flag?: string;
  notes?: string;
  source?: string;
};

export type LabTrendOut = {
  id: string;
  patient_id: string;
  report_id?: string | null;
  test_name: string;
  value: string;
  unit: string;
  observed_on: string;
  flag: string;
  notes: string;
  source: string;
  created_at: string;
};

export class CareWiseApiClient {
  constructor(
    private readonly baseUrl: string,
    private token: string | null = null,
  ) {}

  setToken(token: string) {
    this.token = token;
  }

  me() {
    return this.request<SessionOut>("/auth/me");
  }

  refresh(refreshToken: string) {
    return this.request<LoginResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    if (this.token) headers.set("Authorization", `Bearer ${this.token}`);

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`CareWise API error ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  login(email: string, password: string) {
    return this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  signup(email: string, password: string, role = "patient") {
    return this.request<LoginResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    });
  }

  recordConsent(version: string, region: string) {
    return this.request("/consent", {
      method: "POST",
      body: JSON.stringify({
        consent_type: "care_planning",
        version,
        accepted: true,
        region,
        source: "mobile",
      }),
    });
  }

  saveProfile(input: PatientProfileInput) {
    return this.request<PatientProfileOut>("/patients/me/profile", {
      method: "PUT",
      body: JSON.stringify(input),
    });
  }

  uploadReport(input: ReportUploadInput) {
    return this.request<ReportUploadOut>("/reports/upload", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  analyzeReport(reportId: string) {
    return this.request<ReportAnalysisOut>(`/reports/${reportId}/analyze`, {
      method: "POST",
    });
  }

  saveLabTrend(input: LabTrendInput) {
    return this.request<LabTrendOut>("/lab-trends", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  listLabTrends(patientId: string) {
    return this.request<LabTrendOut[]>(`/lab-trends?patient_id=${encodeURIComponent(patientId)}`);
  }

  getRecommendations(patientId: string, contextText: string, dietStyle: string, goals: string[]) {
    return this.request("/recommendations/ai", {
      method: "POST",
      body: JSON.stringify({
        patient_id: patientId,
        context_text: contextText,
        diet_style: dietStyle,
        goals,
      }),
    });
  }

  searchDoctors(location: string, specialty: string) {
    return this.request(`/doctors/search?location=${encodeURIComponent(location)}&specialty=${encodeURIComponent(specialty)}`);
  }

  matchInsurance(locationRegion: string, conditions: string, budgetLevel: string) {
    return this.request("/insurance/match", {
      method: "POST",
      body: JSON.stringify({
        location_region: locationRegion,
        conditions,
        budget_level: budgetLevel,
      }),
    });
  }

  createSubscriptionCheckout(planCode: "basic" | "plus" | "premium") {
    return this.request("/subscriptions/checkout", {
      method: "POST",
      body: JSON.stringify({ plan_code: planCode }),
    });
  }

  registerNotificationDevice(deviceToken: string, channel = "push") {
    return this.request("/notifications/devices", {
      method: "POST",
      body: JSON.stringify({ channel, device_token: deviceToken, enabled: true }),
    });
  }
}
