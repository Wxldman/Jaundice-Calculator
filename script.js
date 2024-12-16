document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("jaundice-form").addEventListener("submit", function (e) {
        e.preventDefault();

        const birthweight = document.getElementById("birthweight").value;
        const bilirubin = parseFloat(document.getElementById("bilirubin").value);

        if (isNaN(bilirubin)) {
            alert("Please enter a valid bilirubin level.");
            return;
        }

        const dobDate = new Date(document.getElementById("dobDate").value);
        let dobHour = parseInt(document.getElementById("dobHour").value);
        const dobMinute = parseInt(document.getElementById("dobMinute").value);
        const dobAMPM = document.getElementById("dobAMPM").value;

        if (dobAMPM === "PM" && dobHour !== 12) dobHour += 12;
        if (dobAMPM === "AM" && dobHour === 12) dobHour = 0;
        dobDate.setHours(dobHour, dobMinute, 0, 0);

        const sampleDate = new Date(document.getElementById("sampleDate").value);
        let sampleHour = parseInt(document.getElementById("sampleHour").value);
        const sampleMinute = parseInt(document.getElementById("sampleMinute").value);
        const sampleAMPM = document.getElementById("sampleAMPM").value;

        if (sampleAMPM === "PM" && sampleHour !== 12) sampleHour += 12;
        if (sampleAMPM === "AM" && sampleHour === 12) sampleHour = 0;
        sampleDate.setHours(sampleHour, sampleMinute, 0, 0);

        const ageInMilliseconds = sampleDate - dobDate;
        const ageInHours = Math.floor(ageInMilliseconds / (1000 * 60 * 60));
        const ageInMinutes = Math.floor((ageInMilliseconds % (1000 * 60 * 60)) / (1000 * 60));

        document.getElementById("ageResult").style.display = "block";
        document.getElementById("ageDisplay").textContent = `${ageInHours} hours and ${ageInMinutes} minutes`;

        let phototherapyRange = null;
        let exchangeThresholdLower = null;
        let exchangeThresholdUpper = null;
        let repeatSerumBilirubinThreshold = null;

        // Assign ranges based on birthweight and age
        if (birthweight === ">2.5") {
            if (ageInHours < 36) {
                phototherapyRange = [170, 255];
                exchangeThresholdLower = 340;
                exchangeThresholdUpper = 425;
                repeatSerumBilirubinThreshold = 150;
            } else if (ageInHours <= 72) {
                phototherapyRange = [205, 270];
                exchangeThresholdLower = 340;
                exchangeThresholdUpper = 425;
                repeatSerumBilirubinThreshold = 205;
            } else if (ageInHours <= 120) {
                phototherapyRange = [270, 305];
                exchangeThresholdLower = 340;
                exchangeThresholdUpper = 425;
                repeatSerumBilirubinThreshold = 270;
            } else {
                phototherapyRange = [305, 340];
                exchangeThresholdLower = 375;
                exchangeThresholdUpper = 460;
                repeatSerumBilirubinThreshold = 270;
            }
        } else if (birthweight === "1.5-2.5") {
            if (ageInHours < 36) {
                phototherapyRange = [155, 240];
                exchangeThresholdLower = 255;
                exchangeThresholdUpper = 340;
                repeatSerumBilirubinThreshold = 135;
            } else if (ageInHours <= 96) {
                phototherapyRange = [205, 255];
                exchangeThresholdLower = 255;
                exchangeThresholdUpper = 340;
                repeatSerumBilirubinThreshold = 170;
            } else {
                phototherapyRange = [220, 270];
                exchangeThresholdLower = 290;
                exchangeThresholdUpper = 375;
                repeatSerumBilirubinThreshold = 205;
            }
        } else if (birthweight === "1.0-1.5") {
            if (ageInHours < 36) {
                phototherapyRange = [120, 205];
                exchangeThresholdLower = 240;
                exchangeThresholdUpper = 305;
                repeatSerumBilirubinThreshold = 100;
            } else if (ageInHours <= 96) {
                phototherapyRange = [205, 240];
                exchangeThresholdLower = 255;
                exchangeThresholdUpper = 325;
                repeatSerumBilirubinThreshold = 170;
            } else {
                phototherapyRange = [205, 255];
                exchangeThresholdLower = 255;
                exchangeThresholdUpper = 325;
                repeatSerumBilirubinThreshold = 205;
            }
        } else if (birthweight === "<1.0") {
            if (ageInHours < 36) {
                phototherapyRange = [100, 170];
                exchangeThresholdLower = 205;
                exchangeThresholdUpper = 240;
                repeatSerumBilirubinThreshold = 100;
            } else if (ageInHours <= 96) {
                phototherapyRange = [135, 170];
                exchangeThresholdLower = 205;
                exchangeThresholdUpper = 240;
                repeatSerumBilirubinThreshold = 135;
            } else {
                phototherapyRange = [155, 190];
                exchangeThresholdLower = 215;
                exchangeThresholdUpper = 250;
                repeatSerumBilirubinThreshold = 155;
            }
        }

        const resultDiv = document.getElementById("result");
        resultDiv.style.display = "block";

        // Calculate result
        if (bilirubin > exchangeThresholdUpper) {
            resultDiv.className = "result alert";
            resultDiv.innerHTML = `<strong>Critical Alert:</strong> Bilirubin (${bilirubin} mmol/L) exceeds the upper limit for exchange transfusion (${exchangeThresholdUpper} mmol/L). Immediate intervention required!`;
        } else if (bilirubin >= exchangeThresholdLower && bilirubin <= exchangeThresholdUpper) {
            resultDiv.className = "result alert";
            resultDiv.innerHTML = `<strong>Exchange Transfusion:</strong> Bilirubin (${bilirubin} mmol/L) is within the exchange transfusion range. Immediate intervention needed.`;
        } else if (bilirubin >= phototherapyRange[0] && bilirubin <= phototherapyRange[1]) {
            const midPoint = (phototherapyRange[0] + phototherapyRange[1]) / 2;
            const phototherapyType = bilirubin <= midPoint ? "Single Phototherapy" : "Double Phototherapy";
            resultDiv.className = "result alert";
            resultDiv.innerHTML = `<strong>Phototherapy:</strong> Bilirubin (${bilirubin} mmol/L) is in phototherapy range. Recommended action: ${phototherapyType}.`;
        } else if (bilirubin >= repeatSerumBilirubinThreshold && bilirubin < phototherapyRange[0]) {
            resultDiv.className = "result warning";
            resultDiv.innerHTML = `<strong>Repeat Serum Bilirubin:</strong> Bilirubin (${bilirubin} mmol/L) is within the repeat serum bilirubin range. Please repeat serum bilirubin measurement.`;
        } else if (bilirubin < repeatSerumBilirubinThreshold) {
            resultDiv.className = "result success";
            resultDiv.innerHTML = `<strong>Normal:</strong> Bilirubin is below repeat serum bilirubin threshold. No treatment needed.`;
        } else {
            resultDiv.className = "result success";
            resultDiv.innerHTML = `<strong>Normal:</strong> Bilirubin is within safe limits. No treatment required.`;
        }

        // Display reference sheet
        const referenceSheetDiv = document.getElementById("referenceSheet");
        referenceSheetDiv.style.display = "block";
        referenceSheetDiv.innerHTML = `
            <h3>Reference Sheet</h3>
            <table>
                <tr>
                    <th>Repeat Serum Bilirubin</th>
                    <th>Phototherapy Range</th>
                    <th>Exchange Transfusion Range</th>
                </tr>
                <tr>
                    <td>${repeatSerumBilirubinThreshold} mmol/L</td>
                    <td>${phototherapyRange[0]} - ${phototherapyRange[1]} mmol/L</td>
                    <td>${exchangeThresholdLower} - ${exchangeThresholdUpper} mmol/L</td>
                </tr>
            </table>
        `;
    });

    document.getElementById("recalculate-btn").addEventListener("click", function () {
        document.getElementById("jaundice-form").reset();
        document.getElementById("result").style.display = "none";
        document.getElementById("ageResult").style.display = "none";
        document.getElementById("referenceSheet").style.display = "none";
        document.getElementById("recalculate-btn").style.display = "none";
    });
});
