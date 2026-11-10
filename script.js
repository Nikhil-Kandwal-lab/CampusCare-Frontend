const form = document.getElementById("grievanceForm");
const problemInput = document.getElementById("problem");
const charCount = document.getElementById("charCount");
const submitButton = document.getElementById("submitButton");
const resetButton = document.getElementById("resetButton");

const toast = document.getElementById("toast");
const closeToast = document.getElementById("closeToast");

const demoModal = document.getElementById("demoModal");
const modalClose = document.getElementById("modalClose");
const modalDone = document.getElementById("modalDone");

const demoComplaintId = document.getElementById("demoComplaintId");
const demoStudent = document.getElementById("demoStudent");
const demoCategory = document.getElementById("demoCategory");
const demoStatus = document.getElementById("demoStatus");

let toastTimer = null;

function updateCharacterCount() {
    charCount.textContent = `${problemInput.value.length} / 1000`;
}

problemInput.addEventListener("input", updateCharacterCount);

document.querySelectorAll(".category-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
        const text = chip.dataset.text || "";
        const current = problemInput.value.trim();

        if (!current) {
            problemInput.value = text;
        } else if (!current.toLowerCase().includes(text.trim().toLowerCase())) {
            problemInput.value = `${current} ${text}`;
        }

        problemInput.focus();
        updateCharacterCount();
        clearFieldError("problem");
    });
});

document.getElementById("phone").addEventListener("input", (event) => {
    event.target.value = event.target.value.replace(/\D/g, "").slice(0, 10);
});

function setFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const group = field.closest(".input-group");
    const error = document.getElementById(`${fieldId}Error`);

    if (group) {
        group.classList.add("has-error");
    }

    if (error) {
        error.textContent = message;
    }
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const group = field.closest(".input-group");
    const error = document.getElementById(`${fieldId}Error`);

    if (group) {
        group.classList.remove("has-error");
    }

    if (error) {
        error.textContent = "";
    }
}

function clearAllErrors() {
    ["studentName", "rollNumber", "email", "phone", "course", "year", "problem"]
        .forEach(clearFieldError);
}

function validateForm() {
    clearAllErrors();

    const name = document.getElementById("studentName").value.trim();
    const roll = document.getElementById("rollNumber").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const course = document.getElementById("course").value;
    const year = document.getElementById("year").value;
    const problem = problemInput.value.trim();

    let valid = true;

    if (name.length < 2) {
        setFieldError("studentName", "Please enter your full name.");
        valid = false;
    }

    if (roll.length < 2) {
        setFieldError("rollNumber", "Please enter your roll / registration number.");
        valid = false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFieldError("email", "Please enter a valid email address.");
        valid = false;
    }

    if (!/^\d{10}$/.test(phone)) {
        setFieldError("phone", "Please enter a valid 10-digit phone number.");
        valid = false;
    }

    if (!course) {
        setFieldError("course", "Please select your branch.");
        valid = false;
    }

    if (!year) {
        setFieldError("year", "Please select your year.");
        valid = false;
    }

    if (problem.length < 10) {
        setFieldError("problem", "Please describe the problem in at least 10 characters.");
        valid = false;
    }

    return valid;
}

function showToast(title, message) {
    document.getElementById("toastTitle").textContent = title;
    document.getElementById("toastMessage").textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 4500);
}

function openModal(studentName, category, status, complaintId) {
    demoStudent.textContent = studentName || "Student";

    document.getElementById("demoCategory").textContent =
        category || "Other";

    document.getElementById("demoStatus").textContent =
        status || "Forwarded to HOD";

    document.getElementById("demoComplaintId").textContent =
        complaintId
            ? `CC-${String(complaintId).padStart(5, "0")}`
            : "—";

    demoModal.classList.add("show");
    demoModal.setAttribute("aria-hidden", "false");
}

function closeModal() {
    demoModal.classList.remove("show");
    demoModal.setAttribute("aria-hidden", "true");
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateForm()) {
        const firstError = document.querySelector(
            ".has-error input, .has-error select, .has-error textarea"
        );

        if (firstError) {
            firstError.focus();
        }

        showToast(
            "Check your details",
            "Please fix the highlighted fields."
        );

        return;
    }

    const formData = {
        studentName: document.getElementById("studentName").value.trim(),
        rollNumber: document.getElementById("rollNumber").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        course: document.getElementById("course").value,
        year: document.getElementById("year").value,
        problem: problemInput.value.trim()
    };

    submitButton.disabled = true;
    submitButton.querySelector("span:first-child").textContent = "Sending...";

    try {
        const response = await fetch("https://campuscare-hvit.onrender.com/api/complaints", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        console.log("AI Category:", result.category);
        console.log("FULL BACKEND RESPONSE:", result);
        console.log("Complaint ID:", result.complaintId);

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Something went wrong.");
        }

        showToast(
            "Complaint submitted",
            "Your complaint has been received by CampusCare."
        );

        openModal(
            formData.studentName,
            result.category,
            result.status,
            result.complaint_id
        );

        form.reset();
        updateCharacterCount();
        clearAllErrors();

    } catch (error) {
        console.error("Backend Error:", error);

        showToast(
            "Connection error",
            "Could not connect to the CampusCare backend."
        );

    } finally {
        submitButton.disabled = false;
        submitButton.querySelector("span:first-child").textContent =
            "Submit Grievance";
    }
});

resetButton.addEventListener("click", () => {
    setTimeout(() => {
        clearAllErrors();
        updateCharacterCount();
    }, 0);
});

closeToast.addEventListener("click", () => {
    toast.classList.remove("show");
});

modalClose.addEventListener("click", closeModal);
modalDone.addEventListener("click", closeModal);

demoModal.addEventListener("click", (event) => {
    if (event.target === demoModal) {
        closeModal();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeModal();
        toast.classList.remove("show");
    }
});

updateCharacterCount();
