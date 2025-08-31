// ✅ بدل ما نستدعي Google Script مباشرة
// نخلي الطلب يمر عبر Netlify Proxy (netlify.toml)
const API_URL = "/api";
let data = []; // نخزن بيانات المدارس هنا

// ✅ استخراج اليوم/الشهر/السنة من التاريخ
document.addEventListener("DOMContentLoaded", () => {
  const visitDateEl = document.getElementById("visit_date");
  if (visitDateEl) {
    visitDateEl.addEventListener("change", function () {
      const date = new Date(this.value);
      const days = ["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
      document.getElementById("visit_day").value = days[date.getDay()];
      document.getElementById("visit_month").value = (date.getMonth() + 1).toString().padStart(2, "0");
      document.getElementById("visit_year").value = date.getFullYear();
    });
  }
});

// ✅ تحميل قائمة المدارس عند فتح الصفحة
async function loadSchools() {
  try {
    const res = await fetch(API_URL, { method: "GET" });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

    data = await res.json();

    const regionSelect = document.getElementById("regionFilter");
    const citySelect = document.getElementById("cityFilter");
    const schoolSelect = document.getElementById("schoolFilter");

    // تفريغ القوائم القديمة
    regionSelect.innerHTML = '<option value="">اختر المنطقة</option>';
    citySelect.innerHTML = '<option value="">اختر المدينة</option>';
    schoolSelect.innerHTML = '<option value="">اختر المدرسة</option>';

    // استخراج المناطق
    const regions = [...new Set(data.map(s => s.region))];
    regions.forEach(r => {
      const opt = document.createElement("option");
      opt.value = r;
      opt.textContent = r;
      regionSelect.appendChild(opt);
    });

    // ✅ عند اختيار المنطقة
    regionSelect.addEventListener("change", () => {
      const cities = [...new Set(data.filter(s => s.region === regionSelect.value).map(s => s.city))];
      citySelect.innerHTML = "<option value=''>اختر المدينة</option>";
      citySelect.disabled = false;
      cities.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        citySelect.appendChild(opt);
      });
    });

    // ✅ عند اختيار المدينة
    citySelect.addEventListener("change", () => {
      const schools = data.filter(s => s.city === citySelect.value);
      schoolSelect.innerHTML = "<option value=''>اختر المدرسة</option>";
      schoolSelect.disabled = false;
      schools.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.school;
        opt.textContent = s.school;
        opt.dataset.region = s.region;
        opt.dataset.city = s.city;
        opt.dataset.code = s.code;
        schoolSelect.appendChild(opt);
      });
    });

    // ✅ البحث عن مدرسة
    const schoolSearch = document.getElementById("schoolSearch");
    if (schoolSearch) {
      schoolSearch.addEventListener("input", (e) => {
        const searchTerm = e.target.value.trim().toLowerCase();
        const filteredSchools = data.filter(s => {
          const matchCity = !citySelect.value || s.city === citySelect.value;
          const matchRegion = !regionSelect.value || s.region === regionSelect.value;
          const matchName = s.school.toLowerCase().includes(searchTerm);
          return matchCity && matchRegion && matchName;
        });

        schoolSelect.innerHTML = "<option value=''>اختر المدرسة</option>";
        schoolSelect.disabled = false;
        filteredSchools.forEach(s => {
          const opt = document.createElement("option");
          opt.value = s.school;
          opt.textContent = s.school;
          schoolSelect.appendChild(opt);
        });
      });
    }

    // ✅ عند اختيار مدرسة
    schoolSelect.addEventListener("change", () => {
      const selectedSchool = schoolSelect.value;
      const schoolInfo = data.find(s => s.school === selectedSchool);

      if (schoolInfo) {
        document.getElementById("region").value = schoolInfo.region;
        document.getElementById("city").value = schoolInfo.city;
        document.getElementById("school").value = schoolInfo.school;
        document.getElementById("code").value = schoolInfo.code;

        // ✅ إظهار آخر زيارة وعدد الزيارات
        const infoBox = document.getElementById("lastVisitInfo");
        let formattedDate = "لا يوجد";
        if (schoolInfo.last_visit) {
          const visitDate = new Date(schoolInfo.last_visit);
          formattedDate = visitDate.toLocaleDateString("ar-EG", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
          });
        }

        infoBox.innerHTML = `
          🗓️ آخر زيارة: <b>${formattedDate}</b> |
          🔢 عدد الزيارات: <b>${schoolInfo.visits || 0}</b>
          <br>
          <button id="viewVisitsBtn"
                  style="margin-top:10px; padding:8px 15px;
                        background:#007BFF; color:white;
                        border:none; border-radius:5px; cursor:pointer;">
            استعراض الزيارات السابقة
          </button>
        `;
        infoBox.style.display = "block";

        // ✅ ربط زر استعراض الزيارات
        document.getElementById("viewVisitsBtn").addEventListener("click", () => {
          fetchVisits(schoolInfo.school);
        });

        // ✅ إظهار النموذج
        document.getElementById("evaluationForm").style.display = "block";
      }
    });

  } catch (err) {
    console.error("⚠️ خطأ في تحميل المدارس:", err);
    alert("⚠️ لم يتم تحميل بيانات المدارس من الشيت");
  }
}

// ✅ إدارة خطوات النموذج (next / prev)
document.addEventListener("DOMContentLoaded", () => {
  const steps = document.querySelectorAll(".form-step");
  const nextBtns = document.querySelectorAll(".next");
  const prevBtns = document.querySelectorAll(".prev");
  let currentStep = 0;

  function showStep(index) {
    steps.forEach((step, i) => {
      step.style.display = i === index ? "block" : "none";
    });
  }

  nextBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        showStep(currentStep);
      }
    });
  });

  prevBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
      }
    });
  });

  showStep(currentStep);
});

// ✅ إرسال التقييم إلى السيرفر
document.getElementById("evaluationForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData(this);
  const body = {};
  formData.forEach((value, key) => { body[key] = value; });

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "saveEvaluation", ...body })
    });

    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();

    if (data.success) {
      alert("✅ " + data.message + " | رقم الزيارة: " + data.visitNumber);
      this.reset();
      document.getElementById("evaluationForm").style.display = "none";
      document.getElementById("regionFilter").value = "";
      document.getElementById("cityFilter").innerHTML = '<option value="">اختر المدينة</option>';
      document.getElementById("cityFilter").disabled = true;
      document.getElementById("schoolFilter").innerHTML = '<option value="">اختر المدرسة</option>';
      document.getElementById("schoolFilter").disabled = true;
    } else {
      alert("❌ " + data.message);
    }
  } catch (err) {
    console.error("⚠️ خطأ أثناء الإرسال:", err);
    alert("⚠️ لم يتم الاتصال بالخادم. حاول مرة أخرى.");
  }
});

// ✅ تحميل المدارس + رسالة الترحيب
window.addEventListener("DOMContentLoaded", () => {
  loadSchools();

  // ✅ استرجاع بيانات المستخدم من localStorage
  const role = localStorage.getItem("role") || "المشرف";
  const fullName = localStorage.getItem("fullName") || "مستخدم";
  const welcomeMsg = document.getElementById("welcomeMsg");
  const logoutBtn = document.getElementById("logoutBtn");

  if (welcomeMsg) {
    welcomeMsg.textContent = `👋 مرحباً، ${role} ${fullName}`;
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "index.html";
    });
  }
});

// ✅ تجاوز تسجيل الدخول محليًا (localhost)
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
  console.log("🔓 Localhost detected - auto login as Admin");

  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("role", "المشرف");
  localStorage.setItem("fullName", "Local Admin");
}

// ✅ فتح النافذة
function openVisitsModal(schoolName) {
  document.getElementById("visitsModal").style.display = "flex";
  document.getElementById("visitsTitle").textContent = `📑 زيارات ${schoolName}`;
}

// ✅ إغلاق النافذة
document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("visitsModal").style.display = "none";
});

// ✅ جلب الزيارات من الخادم
async function fetchVisits(schoolName) {
  const loader = document.getElementById("visitsLoader");
  const list = document.getElementById("visitsList");

  loader.style.display = "block";
  list.innerHTML = "";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getVisits", school: schoolName })
    });

    const result = await res.json();
    loader.style.display = "none";

    if (result.success && result.visits.length > 0) {
      result.visits.forEach(v => {
        let formattedDate = "-";
        if (v.visit_date) {
          const d = new Date(v.visit_date);
          const day = ("0" + d.getDate()).slice(-2);
          const month = ("0" + (d.getMonth() + 1)).slice(-2);
          const year = d.getFullYear();
          formattedDate = `${day}-${month}-${year}`;
        }

        const li = document.createElement("li");
        li.innerHTML = `<a href="report.html?school=${encodeURIComponent(v.school)}&visit=${v.visit_number}" target="_blank">
                          🗓️ ${formattedDate} - زيارة رقم ${v.visit_number}
                        </a>`;
        list.appendChild(li);
      });
    } else {
      list.innerHTML = "<li>⚠️ لا توجد زيارات سابقة</li>";
    }

    openVisitsModal(schoolName);

  } catch (err) {
    loader.style.display = "none";
    console.error("خطأ في جلب الزيارات:", err);
    list.innerHTML = "<li>❌ حدث خطأ أثناء جلب البيانات</li>";
    openVisitsModal(schoolName);
  }
}
