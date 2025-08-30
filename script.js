// ✅ بدل ما نستدعي Google Script مباشرة
// نخلي الطلب يمر عبر Netlify Proxy (netlify.toml)
const API_URL = "/api";

// ✅ تحميل قائمة المدارس عند فتح الصفحة
async function loadSchools() {
  try {
    const res = await fetch(API_URL, { method: "GET" });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

    const schools = await res.json();

    const regionSelect = document.getElementById("regionFilter");
    const citySelect = document.getElementById("cityFilter");
    const schoolSelect = document.getElementById("schoolFilter");

    // تفريغ القوائم القديمة
    regionSelect.innerHTML = '<option value="">اختر المنطقة</option>';
    citySelect.innerHTML = '<option value="">اختر المدينة</option>';
    schoolSelect.innerHTML = '<option value="">اختر المدرسة</option>';

    // استخراج المناطق
    const regions = [...new Set(schools.map(s => s.region))];
    regions.forEach(r => {
      const opt = document.createElement("option");
      opt.value = r;
      opt.textContent = r;
      regionSelect.appendChild(opt);
    });

    // ✅ عند اختيار المنطقة
    regionSelect.addEventListener("change", () => {
      citySelect.innerHTML = '<option value="">اختر المدينة</option>';
      citySelect.disabled = false;

      const filteredCities = [...new Set(
        schools.filter(s => s.region === regionSelect.value).map(s => s.city)
      )];

      filteredCities.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        citySelect.appendChild(opt);
      });
    });

    // ✅ عند اختيار المدينة
    citySelect.addEventListener("change", () => {
      schoolSelect.innerHTML = '<option value="">اختر المدرسة</option>';
      schoolSelect.disabled = false;

      const filteredSchools = schools.filter(
        s => s.region === regionSelect.value && s.city === citySelect.value
      );

      filteredSchools.forEach(sch => {
        const opt = document.createElement("option");
        opt.value = sch.school;
        opt.textContent = sch.school;
        opt.dataset.region = sch.region;
        opt.dataset.city = sch.city;
        opt.dataset.code = sch.code;
        schoolSelect.appendChild(opt);
      });
    });

    // ✅ عند اختيار مدرسة
    schoolSelect.addEventListener("change", async () => {
      const selectedOption = schoolSelect.options[schoolSelect.selectedIndex];
      if (!selectedOption.value) return;

      // ✅ تعبئة الحقول الأساسية
      document.getElementById("region").value = selectedOption.dataset.region;
      document.getElementById("city").value = selectedOption.dataset.city;
      document.getElementById("school").value = selectedOption.value;
      document.getElementById("code").value = selectedOption.dataset.code;

      // ✅ استدعاء آخر بيانات للمدرسة من السيرفر
      try {
        const res = await fetch(`${API_URL}?school=${encodeURIComponent(selectedOption.value)}`);
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

        const data = await res.json();

        if (data.status === "found") {
          const record = data.data;
          // ✅ تعبئة الحقول من آخر بيانات محفوظة (ما عدا الحقول المقفلة)
          for (let key in record) {
            const input = document.querySelector(`[name="${key}"]`);
            if (input && !["region", "city", "school", "code"].includes(key)) {
              input.value = record[key];
            }
          }
        }
      } catch (err) {
        console.error("⚠️ خطأ في جلب بيانات المدرسة:", err);
      }

      // ✅ إظهار النموذج
      document.getElementById("evaluationForm").style.display = "block";
    });

  } catch (err) {
    console.error("⚠️ خطأ في تحميل المدارس:", err);
    alert("⚠️ تعذر تحميل قائمة المدارس. يرجى المحاولة لاحقاً.");
  }
}

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

  if (welcomeMsg) {
    welcomeMsg.textContent = `👋 مرحباً، ${role} ${fullName}`;
  }

  const logoutBtn = document.getElementById("logoutBtn");
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

  document.addEventListener("DOMContentLoaded", () => {
    const loginSection = document.getElementById("login-section");
    const dashboardSection = document.getElementById("dashboard");

    if (loginSection && dashboardSection) {
      loginSection.style.display = "none";
      dashboardSection.style.display = "block";
    }
  });
}

// ✅ فتح النافذة
function openVisitsModal() {
  document.getElementById("visitsModal").style.display = "flex";
}

// ✅ إغلاق النافذة
function closeVisitsModal() {
  document.getElementById("visitsModal").style.display = "none";
}

// ✅ جلب الزيارات من الخادم
async function fetchVisits(schoolName) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getVisits", school: schoolName })
    });

    const result = await res.json();
    if (result.success) {
      const visitsList = document.getElementById("visitsList");
      visitsList.innerHTML = ""; // تفريغ القائمة

      if (result.visits.length === 0) {
        visitsList.innerHTML = "<li>⚠️ لا توجد زيارات سابقة</li>";
      } else {
        result.visits.forEach(v => {
          const li = document.createElement("li");
          li.style.padding = "10px";
          li.style.borderBottom = "1px solid #ddd";
          li.style.cursor = "pointer";

          li.innerHTML = `🔹 <b>زيارة رقم ${v.visit_number}</b> - بتاريخ ${v.visit_date}`;
          
          // عند الضغط على الزيارة → فتح صفحة جديدة للتقرير
          li.addEventListener("click", () => {
            const url = `report.html?school=${encodeURIComponent(v.school)}&visit=${v.visit_number}`;
            window.open(url, "_blank");
          });

          visitsList.appendChild(li);
        });
      }

      openVisitsModal();
    } else {
      alert("⚠️ لم يتم جلب الزيارات: " + (result.message || "خطأ غير معروف"));
    }
  } catch (err) {
    console.error("خطأ في جلب الزيارات:", err);
    alert("❌ فشل الاتصال بالخادم");
  }
}
