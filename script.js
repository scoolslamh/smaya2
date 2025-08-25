// ✅ بدل ما نستدعي Google Script مباشرةً
// نخلي الطلب يمر عبر Netlify Proxy (netlify.toml)
const API_URL = "/api";

// ✅ تحميل قائمة المدارس عند فتح الصفحة
async function loadSchools() {
  try {
    const res = await fetch(API_URL, { method: "GET" });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

    const schools = await res.json();

    // استخراج المناطق
    const regions = [...new Set(schools.map(s => s.region))];
    const regionSelect = document.getElementById("regionFilter");

    // تفريغ القوائم القديمة
    regionSelect.innerHTML = '<option value="">اختر المنطقة</option>';

    regions.forEach(r => {
      const opt = document.createElement("option");
      opt.value = r;
      opt.textContent = r;
      regionSelect.appendChild(opt);
    });

    // ✅ عند اختيار المنطقة
    regionSelect.addEventListener("change", () => {
      const citySelect = document.getElementById("cityFilter");
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
    document.getElementById("cityFilter").addEventListener("change", () => {
      const schoolSelect = document.getElementById("schoolFilter");
      schoolSelect.innerHTML = '<option value="">اختر المدرسة</option>';
      schoolSelect.disabled = false;

      const filteredSchools = schools.filter(
        s => s.region === regionSelect.value && s.city === document.getElementById("cityFilter").value
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
    document.getElementById("schoolFilter").addEventListener("change", async () => {
      const schoolSelect = document.getElementById("schoolFilter");
      const selectedOption = schoolSelect.options[schoolSelect.selectedIndex];
      if (!selectedOption.value) return;

      // ✅ تعبئة الحقول الأساسية من القائمة
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
          // تعبية الحقول من آخر بيانات محفوظة (ما عدا الحقول المقفلة)
          for (let key in record) {
            const input = document.querySelector(`[name="${key}"]`);
            if (input && !["region","city","school","code"].includes(key)) {
              input.value = record[key];
            }
          }
        }
      } catch (err) {
        console.error("⚠️ خطأ في جلب بيانات المدرسة:", err);
      }

      // ✅ إظهار النموذج بعد اختيار المدرسة
      document.getElementById("evaluationForm").style.display = "block";
    });

  } catch (err) {
    console.error("⚠️ خطأ في تحميل المدارس:", err);
    alert("⚠️ تعذر تحميل قائمة المدارس. يرجى المحاولة لاحقاً.");
  }
}

// ✅ إرسال التقييم إلى السيرفر
document.getElementById("evaluationForm").addEventListener("submit", async function(e) {
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

// ✅ تحميل المدارس عند فتح الصفحة
window.addEventListener("DOMContentLoaded", loadSchools);
