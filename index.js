let formData = {};
let isPhoneVerified;
let isEmailVerified;

fetch("https://ssodev.astconsulting.in/api/forms")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.json();
  })
  .then((formsData) => {
    formData = formsData.data.filter(
      (item) => item.slug === "my-test-form-2"
    )[0];
    console.log(formData);
    addHeading(formData.displayHeadline);
    addDescription(formData.description);

    formData.fields.map((field) => {
      let type = field.type;
      let name = field.name;
      let label = field.label;
      let required = field.required;

      if (field.visiblity === "visible") {
        if (type == "text") {
          addText(name, label, required);
        } else if (type == "email") {
          addEmail(name, label, required);
          isEmailVerified = false;
        } else if (type == "number") {
          addNumber(name, label, required);
        } else if (type == "tel") {
          addTelephone(name, label, required);
          isPhoneVerified = false;
        } else if (type == "radio" && field.options) {
          addRadioGroup(name, label, required, field.options);
        } else if (type == "select" && field.options) {
          addSelectField(name, label, required, field.options);
        } else if (type == "checkbox" && field.options) {
          addCheckboxField(name, label, required, field.options);
        } else if (type == "file") {
          addFilesField(name, label, required);
        }
      }
    });
  })
  .catch((error) => {
    console.error("Error:", error);
  })
  .finally(() => {
    hideErrors();
  });

//////////////////////////////

function hideErrors() {
  let fieldsData = formData.fields.map((field) => ({
    error: document.getElementById(`${field.type}-${field.name}`),
    emailError: document.getElementById(`incorrect-email`),
    phoneError: document.getElementById(`incorrect-tel`),
  }));
  fieldsData.forEach((fieldData) => {
    if (fieldData.error) fieldData.error.style.display = "none";
    if (fieldData.emailError) fieldData.emailError.style.display = "none";
    if (fieldData.phoneError) fieldData.phoneError.style.display = "none";
  });

  const verifyContainers = document.getElementsByClassName(
    "input-and-verify-button-container"
  );
  [...verifyContainers].map((element) => {
    element.style.display = "none";
  });
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhoneNo(phoneNo) {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phoneNo);
}

function getCookieByName(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

function getFileType(fileName) {
  // Check if the input is a valid string
  if (typeof fileName !== "string" || fileName.trim() === "") {
    return "";
  }

  // Extract the file extension
  const fileExtension = fileName.split(".").pop().toLowerCase();

  // If the file has no extension or the last part is the file name itself, return an empty string
  if (fileExtension === fileName.toLowerCase()) {
    return "";
  }

  return fileExtension;
}

function isVerified() {
  if (isPhoneVerified === undefined && isEmailVerified === true) {
    return true;
  } else if (isPhoneVerified === true && isEmailVerified === undefined) {
    return true;
  } else if (isPhoneVerified === true && isEmailVerified === true) {
    return true;
  } else return false;
}

async function getFileFields(file, isPrivate) {
  const fileType = isPrivate ? "private" : "public";
  if (file) {
    const fileData = new FormData();
    fileData.append("files", file);

    const res = await fetch(
      `https://ssodev.astconsulting.in/api/files/upload?path=${fileType}`,
      {
        method: "POST",
        body: fileData,
      }
    );

    if (res.ok) {
      const { data } = await res.json();
      return {
        type: getFileType(data.fileName),
        fileName: data.fileName,
        url: data.url,
        path: data.path,
      };
    } else {
      console.error("Network error");
    }
  } else {
    console.error("No file selected");
  }
}

async function sendOtp(method) {
  const phoneInput = document.querySelector('input[type="tel"]');
  const phoneError = document.getElementById(`incorrect-tel`);
  const sendPhoneOtpBtn = document.getElementById("send-phone-otp");
  const verifyPhoneContainer = document.getElementById("phone-verify");

  const emailInput = document.querySelector('input[type="email"]');
  const emailError = document.getElementById(`incorrect-email`);
  const sendEmailOtpBtn = document.getElementById("send-email-otp");
  const verifyEmailContainer = document.getElementById("email-verify");
  let data;

  if (method === "phone") {
    if (isValidPhoneNo(phoneInput.value)) {
      phoneError.style.display = "none";
      data = { mobileNumber: `+91${phoneInput.value}` };
      // sendPhoneOtpBtn.innerText = "OTP Sent ✅";
      // sendPhoneOtpBtn.disabled = true;
      // sendPhoneOtpBtn.style.cursor = "not-allowed";
      // phoneInput.disabled = true;
      // verifyPhoneContainer.style.display = "inline";
    } else {
      phoneError.style.display = "inline";
    }
  } else if (method === "email") {
    if (isValidEmail(emailInput.value)) {
      emailError.style.display = "none";
      data = { email: emailInput.value };
      // sendEmailOtpBtn.innerText = "OTP Sent ✅";
      // sendEmailOtpBtn.disabled = true;
      // sendEmailOtpBtn.style.cursor = "not-allowed";
      // emailInput.disabled = true;
      // verifyEmailContainer.style.display = "inline";
    } else {
      emailError.style.display = "inline";
    }
  }

  if (data) {
    const res = await fetch(
      "https://ssodev.astconsulting.in/api/auth/send-otp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );
    if (res?.ok) {
      if (method == "phone") {
        sendPhoneOtpBtn.innerText = "OTP Sent ✅";
        sendPhoneOtpBtn.disabled = true;
        sendPhoneOtpBtn.style.cursor = "not-allowed";
        phoneInput.disabled = true;
        verifyPhoneContainer.style.display = "inline";
      } else if (method == "email") {
        sendEmailOtpBtn.innerText = "OTP Sent ✅";
        sendEmailOtpBtn.disabled = true;
        sendEmailOtpBtn.style.cursor = "not-allowed";
        emailInput.disabled = true;
        verifyEmailContainer.style.display = "inline";
      }
    } else {
      if (method == "phone") {
        sendPhoneOtpBtn.innerText = "Failed ❌";
        sendPhoneOtpBtn.disabled = true;
      } else if (method == "email") {
        sendEmailOtpBtn.innerText = "Failed ❌";
        sendEmailOtpBtn.disabled = true;
      }
    }
  }
}

async function verifyOtp(method) {
  const phoneInput = document.querySelector('input[type="tel"]');
  const phoneOtpInput = document.getElementById("phone-otp");
  const verifyPhoneOtpBtn = document.getElementById("verify-phone-otp");

  const emailInput = document.querySelector('input[type="email"]');
  const emailOtpInput = document.getElementById("email-otp");
  const verifyEmailOtpBtn = document.getElementById("verify-email-otp");
  let data;

  if (method === "phone") {
    if (isValidPhoneNo(phoneInput.value)) {
      data = {
        mobileNumber: `+91${phoneInput.value}`,
        mobileOtp: Number(phoneOtpInput.value),
      };
    }
  } else if (method === "email") {
    if (isValidEmail(emailInput.value)) {
      data = { email: emailInput.value, emailOtp: Number(emailOtpInput.value) };
    }
  }

  if (data) {
    const res = await fetch(
      "https://ssodev.astconsulting.in/api/auth/verify-otp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );
    if (res?.ok) {
      if (method == "phone") {
        verifyPhoneOtpBtn.innerText = "Verified ✅";
        verifyPhoneOtpBtn.disabled = true;
        verifyPhoneOtpBtn.style.cursor = "not-allowed";
        phoneOtpInput.disabled = true;
        isPhoneVerified = true;
      } else if (method == "email") {
        verifyEmailOtpBtn.innerText = "Verified ✅";
        verifyEmailOtpBtn.disabled = true;
        verifyEmailOtpBtn.style.cursor = "not-allowed";
        emailOtpInput.disabled = true;
        isEmailVerified = true;
      }
    } else {
      if (method == "phone") {
        verifyPhoneOtpBtn.innerText = "Failed ❌";
        verifyPhoneOtpBtn.disabled = true;
      } else if (method == "email") {
        verifyEmailOtpBtn.innerText = "Failed ❌";
        verifyEmailOtpBtn.disabled = true;
      }
    }
  }
}

/////////////////////////

function addHeading(heading) {
  document.getElementById("form-heading").innerText = heading;
}

function addDescription(desc) {
  document.getElementById("form-description").innerText = desc;
}

function addText(name, label, required = false) {
  const dynamicFields = document.getElementById("dynamicFields");

  const newField = `
  <div class="input-and-label-container">
  <label for="${name}">${label}${required ? "*" : ""}</label>
  <input type="text" name="${name}" placeholder="Enter ${label}" id=${name}>
  <span class='error-message' id="text-${name}">This field is required*</span>
  </div>
  `;

  dynamicFields.insertAdjacentHTML("beforeend", newField);
}

function addEmail(name, label, required = false) {
  const dynamicFields = document.getElementById("dynamicFields");

  const newField = `
  <div class="input-and-label-container">
      <label for="${name}">${label}${required ? "*" : ""}</label>
      <div class="input-and-send-button-container">
          <input type="email" name="${name}" placeholder="Enter ${label}" id=${name}>
          <button class="verify-button" type="button" id="send-email-otp" onclick="sendOtp('email')">Send OTP</button>
      </div>
      <span class='error-message' id="email-${name}">This field is required*</span>
      <span class='error-message' id="incorrect-email">Incorrect Email*</span>

      <div class="input-and-verify-button-container" id="email-verify">
          <input type="number" id="email-otp" name="emailOTP" placeholder="Enter Email OTP" pattern="[0-9]{6}">
          <button class="verify-button" type="button" id="verify-email-otp" onclick="verifyOtp('email')">Verify OTP</button>
      </div>
      <span id="phoneOTPError" class="" style="display: none;">Invalid OTP*</span>
      <span id="phoneOTPSuccess" class="" style="display: none;">Phone OTP Verified*</span>
  </div>
  `;

  dynamicFields.insertAdjacentHTML("beforeend", newField);
}

function addTelephone(name, label, required = false) {
  const dynamicFields = document.getElementById("dynamicFields");

  const newField = `
  <div class="input-and-label-container">
      <label for="${name}">${label}${required ? "*" : ""}</label>
      <div class="input-and-send-button-container">
          <input type="tel" id="phone" name=${name} placeholder="Enter ${label}" pattern="[0-9]{10}">
          <button class="verify-button" type="button" id="send-phone-otp" onclick="sendOtp('phone')">Send OTP</button>
      </div>
      <span class='error-message' id="tel-${name}">This field is required*</span>
      <span class='error-message' id="incorrect-tel">Incorrect Phone No*</span>
      
      <div class="input-and-verify-button-container" id="phone-verify">
          <input type="number" id="phone-otp" name="phoneOTP" placeholder="Enter Phone OTP" pattern="[0-9]{6}">
          <button class="verify-button " type="button" id="verify-phone-otp" onclick="verifyOtp('phone')">Verify OTP</button>
      </div>
      <span id="phoneOTPError" class="" style="display: none;">Invalid OTP*</span>
      <span id="phoneOTPSuccess" class="" style="display: none;">Phone OTP Verified*</span>
  </div>
              `;

  dynamicFields.insertAdjacentHTML("beforeend", newField);
}

function addNumber(name, label, required = false) {
  const dynamicFields = document.getElementById("dynamicFields");

  const newField = `
  <div class="input-and-label-container">
  <label for="${name}">${label}${required ? "*" : ""}</label>
              <input type="number" name="${name}" placeholder="Enter ${label}" id=${name}>
              <span class='error-message' id="number-${name}">This field is required*</span>
              </div>
              `;

  dynamicFields.insertAdjacentHTML("beforeend", newField);
}

function addRadioGroup(name, label, required = false, options) {
  const dynamicFields = document.getElementById("dynamicFields");

  const newGroup = `
              <div class="input-and-label-container">
              <p>${label}${required ? "*" : ""}</p>
              <div class="optionsField">
              ${options
                .map((option, index) => {
                  return `<span>
                  <label for=${index}>${option}</label>
                  <input
                  type="radio"
                  id=${index}
                  name=${name}
                  value=${option}
                  />
                  </span>`;
                })
                .join("")}
                </div>
                <span class='error-message' id="radio-${name}">This field is required*</span>
                </div>
                `;

  dynamicFields.insertAdjacentHTML("beforeend", newGroup);
}

function addSelectField(name, label, required = false, options) {
  const dynamicFields = document.getElementById("dynamicFields");

  const newField = `
                <div class="input-and-label-container">
                <label for="${name}">${label}${required ? "*" : ""}</label>
                <select id="${name}" name="${name}">
                <option value="" selected>Select ${label}</option>
                ${options.map((option, index) => {
                  return `<option value=${option}>${option}</option>`;
                })}
                </select>
                <span class='error-message' id="select-${name}">This field is required*</span>
                </div>
                `;

  dynamicFields.insertAdjacentHTML("beforeend", newField);
}

function addCheckboxField(name, label, required = false, options) {
  const dynamicFields = document.getElementById("dynamicFields");

  const newGroup = `
                <div class="input-and-label-container">
                <p>${label}${required ? "*" : ""}</p>
                <div class="optionsField">
                ${options
                  .map((option, index) => {
                    return `<span key=${index}>
                    <label for=${index}>${option}</label>
                    <input
                    type="checkbox"
                    id=${index}
                    name=${name}
                    value=${option}
                    />
                    </span>`;
                  })
                  .join("")}
                  </div>
                  <span class='error-message' id="checkbox-${name}">This field is required*</span>
                  </div>
                  `;

  dynamicFields.insertAdjacentHTML("beforeend", newGroup);
}

function addFilesField(name, label, required) {
  const dynamicFields = document.getElementById("dynamicFields");

  const newField = `
                  <div class="input-and-label-container">
                  <label for=${name}>${label}${required ? "*" : ""}</label>
                  <input type="file" id=${name} name=${name} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" size="300000">
                  <span class='error-message' id="file-${name}">This field is required*</span>
                  </div>
                  `;

  dynamicFields.insertAdjacentHTML("beforeend", newField);
}

/////////////////////////

// const phoneNo = document.querySelector('input[type="tel"]');

const submit = document.getElementById("dynamic-form");
submit.addEventListener("submit", onSubmitClick);

async function onSubmitClick(event) {
  event.preventDefault();

  let isValid = true;
  let fieldsDataArray = [];

  let fieldsData = formData.fields.map((field) => {
    console.log(field);
    if (
      (field.type === "text" ||
        field.type === "email" ||
        field.type === "number" ||
        field.type === "tel" ||
        field.type === "select" ||
        field.type === "file") &&
      document.getElementById(field.name) &&
      field.visiblity === "visible"
    ) {
      return {
        name: field.name,
        input: document.getElementById(field.name),
        type: field.type,
        error: document.getElementById(`${field.type}-${field.name}`),
        required: field.required,
        isPrivate: field.isPrivate || "",
      };
    }
  });

  let optionsFields = formData.fields.map((field) => {
    if (
      field.visiblity === "visible" &&
      document.querySelectorAll(`input[name=${field.name}]`)
    ) {
      if (field.type === "radio") {
        return {
          name: field.name,
          input: document.querySelector(`input[name=${field.name}]:checked`),
          type: field.type,
          error: document.getElementById(`${field.type}-${field.name}`),
          required: field.required,
        };
      } else if (
        field.type === "checkbox" &&
        document.querySelectorAll(`input[name=${field.name}]`)
      ) {
        return {
          name: field.name,
          input: document.querySelectorAll(`input[name=${field.name}]:checked`),
          type: field.type,
          error: document.getElementById(`${field.type}-${field.name}`),
          required: field.required,
        };
      }
    }
  });

  const tempVals = fieldsData.map(async (fieldData) => {
    if (fieldData && fieldData.type) {
      if (
        fieldData.type === "text" ||
        fieldData.type === "number" ||
        fieldData.type === "tel" ||
        fieldData.type === "select"
      ) {
        if (fieldData.input.value.trim() !== "") {
          fieldData.error.style.display = "none";
          return [
            ...fieldsDataArray,
            {
              name: fieldData.name,
              type: fieldData.type,
              value: fieldData.input.value.trim(),
            },
          ];
        } else if (fieldData.required) {
          fieldData.error.style.display = "inline";
          isValid = false;
          return null;
        }
      } else if (fieldData.type === "email") {
        let incorrectEmail = document.getElementById("incorrect-email");
        if (fieldData.input.value.trim() === "" && fieldData.required) {
          fieldData.error.style.display = "inline";
          incorrectEmail.style.display = "none";
          isValid = false;
          return null;
        } else if (isValidEmail(fieldData.input.value.trim())) {
          fieldData.error.style.display = "none";
          incorrectEmail.style.display = "none";
          return [
            ...fieldsDataArray,
            {
              name: fieldData.name,
              type: fieldData.type,
              value: fieldData.input.value.trim(),
            },
          ];
        } else {
          fieldData.error.style.display = "none";
          incorrectEmail.style.display = "inline";
          return null;
        }
      } else if (fieldData.type === "file") {
        if (fieldData.input.files.length !== 0) {
          const fileValue = await getFileFields(
            fieldData.input.files[0],
            fieldData.isPrivate
          );
          fieldData.error.style.display = "none";
          return [
            ...fieldsDataArray,
            {
              name: fieldData.name,
              type: fieldData.type,
              value: fileValue,
            },
          ];
        } else if (fieldData.required) {
          fieldData.error.style.display = "inline";
          isValid = false;
          return null;
        }
      } else {
        return null;
      }
    }

    return null;
  });

  const tempFieldArr = await Promise.all(tempVals);
  fieldsDataArray = tempFieldArr.filter(Boolean);
  fieldsDataArray = fieldsDataArray.map((subArray) => subArray[0]);

  optionsFields.forEach((optionField) => {
    if (optionField) {
      if (optionField.type === "radio") {
        if (optionField.input && optionField.input?.value !== "") {
          fieldsDataArray = [
            ...fieldsDataArray,
            {
              name: optionField.name,
              type: optionField.type,
              value: optionField.input.value,
            },
          ];
          optionField.error.style.display = "none";
        } else if (optionField.required) {
          optionField.error.style.display = "inline";
          isValid = false;
        }
      } else if (optionField.type === "checkbox") {
        if (optionField.input && optionField.input?.length !== 0) {
          let checkboxValues = [...optionField.input].map(
            (checkbox) => checkbox.value
          );
          fieldsDataArray = [
            ...fieldsDataArray,
            {
              name: optionField.name,
              type: optionField.type,
              value: checkboxValues,
            },
          ];
          optionField.error.style.display = "none";
        } else if (optionField.required) {
          optionField.error.style.display = "inline";
          isValid = false;
        }
      }
    }
  });

  if (isValid) {
    if (!isVerified()) {
      document.getElementById("submit-error-message").innerText =
        "Verify the fields*";
    } else {
      document.getElementById("submit-error-message").innerText = "";
      let data = {
        formId: formData._id,
        userId: getCookieByName("_sso_token") || "",
        fields: fieldsDataArray,
      };

      try {
        const response = await fetch(
          "https://ssodev.astconsulting.in/api/form-response",
          {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          // document.getElementById("dynamic-form").reset();
          setTimeout(function () {
            location.reload(true);
          }, 1000);
          alert("Form Submitted Successfully");
        } else {
          alert("Error Submitting The Data!");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }
  }
}
