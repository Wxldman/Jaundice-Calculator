document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("jaundice-form");
  const resultDiv = document.getElementById("result");
  const ageResultDiv = document.getElementById("ageResult");
  const ageDisplayDiv = document.getElementById("ageDisplay");
  const referenceSheetDiv = document.getElementById("referenceSheet");
  const recalculateBtn = document.getElementById("recalculate-btn");

  const UNIT = "µmol/L";

  /*
    Neonatal jaundice treatment thresholds based on the uploaded local chart.

    A = Repeat serum bilirubin in 6–8 hours
    B = Phototherapy range
    C = Exchange transfusion threshold

    Note: The printed chart says mmol/L, but the values clinically correspond to µmol/L.
  */

  const jaundiceTable = {
    ">2.5": [
      {
        ageBand: "<36 h",
        repeat: 150,
        photoLow: 180,
        photoHigh: 280,
        exchange: 340
      },
      {
        ageBand: "36–72 h",
        repeat: 210,
        photoLow: 240,
        photoHigh: 300,
        exchange: 340
      },
      {
        ageBand: "72–120 h",
        repeat: 275,
        photoLow: 300,
        photoHigh: 330,
        exchange: 360
      },
      {
        ageBand: ">120 h",
        repeat: 275,
        photoLow: 320,
        photoHigh: 350,
        exchange: 380
      }
    ],

    "1.5-2.5": [
      {
        ageBand: "<36 h",
        repeat: 130,
        photoLow: 150,
        photoHigh: 240,
        exchange: 290
      },
      {
        ageBand: "36–72 h",
        repeat: 180,
        photoLow: 200,
        photoHigh: 250,
        exchange: 290
      },
      {
        ageBand: "72–120 h",
        repeat: 210,
        photoLow: 250,
        photoHigh: 280,
        exchange: 305
      },
      {
        ageBand: ">120 h",
        repeat: 235,
        photoLow: 270,
        photoHigh: 300,
        exchange: 320
      }
    ],

    "1.0-1.5": [
      {
        ageBand: "<36 h",
        repeat: 105,
        photoLow: 125,
        photoHigh: 200,
        exchange: 240
      },
      {
        ageBand: "36–72 h",
        repeat: 150,
        photoLow: 170,
        photoHigh: 220,
        exchange: 240
      },
      {
        ageBand: "72–120 h",
        repeat: 175,
        photoLow: 210,
        photoHigh: 230,
        exchange: 250
      },
      {
        ageBand: ">120 h",
        repeat: 185,
        photoLow: 225,
        photoHigh: 250,
        exchange: 265
      }
    ],

    "<1.0": [
      {
        ageBand: "<36 h",
        repeat: 90,
        photoLow: 110,
        photoHigh: 170,
        exchange: 200
      },
      {
        ageBand: "36–72 h",
        repeat: 125,
        photoLow: 145,
        photoHigh: 180,
        exchange: 200
      },
      {
        ageBand: "72–120 h",
        repeat: 150,
        photoLow: 180,
        photoHigh: 200,
        exchange: 215
      },
      {
        ageBand: ">120 h",
        repeat: 165,
        photoLow: 190,
        photoHigh: 210,
        exchange: 225
      }
    ]
  };

  const birthweightLabels = {
    ">2.5": "> 2.5 kg",
    "1.5-2.5": "1.5–2.5 kg",
    "1.0-1.5": "1.0–1.5 kg",
    "<1.0": "< 1.0 kg"
  };

  function getAgeBandRow(birthweight, ageHoursExact) {
    const rows = jaundiceTable[birthweight];

    if (!rows) return null;

    if (ageHoursExact < 36) return rows[0];
    if (ageHoursExact <= 72) return rows[1];
    if (ageHoursExact <= 120) return rows[2];

    return rows[3];
  }

  function parseDateTime(dateId, hourId, minuteId, ampmId, label) {
    const dateValue = document.getElementById(dateId).value;
    const hourValue = Number(document.getElementById(hourId).value);
    const minuteValue = Number(document.getElementById(minuteId).value);
    const ampmValue = document.getElementById(ampmId).value;

    if (!dateValue) {
      throw new Error(`Please enter the ${label} date.`);
    }

    if (
      !Number.isInteger(hourValue) ||
      hourValue < 1 ||
      hourValue > 12
    ) {
      throw new Error(`Please enter a valid hour for ${label}.`);
    }

    if (
      !Number.isInteger(minuteValue) ||
      minuteValue < 0 ||
      minuteValue > 59
    ) {
      throw new Error(`Please enter valid minutes for ${label}.`);
    }

    let hour24 = hourValue;

    if (ampmValue === "PM" && hour24 !== 12) {
      hour24 += 12;
    }

    if (ampmValue === "AM" && hour24 === 12) {
      hour24 = 0;
    }

    const [year, month, day] = dateValue.split("-").map(Number);

    return new Date(year, month - 1, day, hour24, minuteValue, 0, 0);
  }

  function formatNumber(value) {
    return Number(value).toLocaleString("en-US", {
      maximumFractionDigits: 2
    });
  }

  function showResult(className, html) {
    resultDiv.className = `result ${className}`;
    resultDiv.innerHTML = html;
    resultDiv.style.display = "block";
  }

  function displayReferenceSheet(birthweight, row) {
    referenceSheetDiv.style.display = "block";

    referenceSheetDiv.innerHTML = `
      <h3>Reference Sheet</h3>

      <table>
        <tr>
          <th>Birthweight</th>
          <th>Age Band</th>
          <th>Repeat Serum BR</th>
          <th>Phototherapy</th>
          <th>Exchange Transfusion</th>
        </tr>

        <tr>
          <td>${birthweightLabels[birthweight]}</td>
          <td>${row.ageBand}</td>
          <td>
            ${row.repeat} ${UNIT}
            <br>
            <small>Repeat in 6–8 hours</small>
          </td>
          <td>${row.photoLow}–${row.photoHigh} ${UNIT}</td>
          <td>≥ ${row.exchange} ${UNIT}</td>
        </tr>
      </table>
    `;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const birthweight = document.getElementById("birthweight").value;
    const bilirubin = Number(document.getElementById("bilirubin").value);

    if (!birthweight) {
      alert("Please select the birthweight.");
      return;
    }

    if (!Number.isFinite(bilirubin) || bilirubin < 0) {
      alert("Please enter a valid bilirubin level.");
      return;
    }

    let dobDate;
    let sampleDate;

    try {
      dobDate = parseDateTime(
        "dobDate",
        "dobHour",
        "dobMinute",
        "dobAMPM",
        "date and time of birth"
      );

      sampleDate = parseDateTime(
        "sampleDate",
        "sampleHour",
        "sampleMinute",
        "sampleAMPM",
        "date and time of bilirubin sample"
      );
    } catch (error) {
      alert(error.message);
      return;
    }

    const ageInMilliseconds = sampleDate - dobDate;

    if (ageInMilliseconds < 0) {
      alert("The bilirubin sample time cannot be before the time of birth.");
      return;
    }

    const ageHoursExact = ageInMilliseconds / (1000 * 60 * 60);
    const ageInHours = Math.floor(ageHoursExact);
    const ageInMinutes = Math.floor(
      (ageInMilliseconds % (1000 * 60 * 60)) / (1000 * 60)
    );

    const row = getAgeBandRow(birthweight, ageHoursExact);

    if (!row) {
      alert("Unable to determine the treatment threshold. Please check the values entered.");
      return;
    }

    ageResultDiv.style.display = "block";
    ageDisplayDiv.textContent = `${ageInHours} hours and ${ageInMinutes} minutes`;

    const bilirubinDisplay = formatNumber(bilirubin);

    /*
      Interpretation logic:

      1. Exchange threshold reached: urgent senior/neonatology review.
      2. Above phototherapy band but below exchange: treat as high-risk/intensive phototherapy zone.
      3. Within phototherapy range: single vs double phototherapy based on lower/upper half of range.
      4. Repeat range: repeat bilirubin in 6–8 hours.
      5. Below action threshold: continue clinical assessment.
    */

    if (bilirubin >= row.exchange) {
      showResult(
        "alert",
        `
          <strong>Exchange Transfusion Threshold Reached</strong>
          <br><br>
          Bilirubin is <strong>${bilirubinDisplay} ${UNIT}</strong>.
          This is at or above the exchange transfusion threshold of
          <strong>${row.exchange} ${UNIT}</strong> for this birthweight and age band.
          <br><br>
          <strong>Recommended action:</strong>
          Urgent senior/neonatology review. Commence intensive phototherapy while preparing for possible exchange transfusion.
        `
      );
    } else if (bilirubin > row.photoHigh) {
      showResult(
        "alert",
        `
          <strong>Above Phototherapy Band but Below Exchange Threshold</strong>
          <br><br>
          Bilirubin is <strong>${bilirubinDisplay} ${UNIT}</strong>.
          This is above the listed phototherapy band of
          <strong>${row.photoLow}–${row.photoHigh} ${UNIT}</strong>,
          but below the exchange transfusion threshold of
          <strong>${row.exchange} ${UNIT}</strong>.
          <br><br>
          <strong>Recommended action:</strong>
          Double/intensive phototherapy, urgent senior review, and close repeat bilirubin monitoring.
          <br><br>
          <em>IVF Guidance:</em>
          Consider 60% of required maintenance fluids if clinically appropriate and in keeping with local protocol.
        `
      );
    } else if (bilirubin >= row.photoLow) {
      const midpoint = (row.photoLow + row.photoHigh) / 2;
      const isLowerPhototherapyBand = bilirubin < midpoint;

      const phototherapyType = isLowerPhototherapyBand
        ? "Single Phototherapy"
        : "Double Phototherapy";

      const ivfPercent = isLowerPhototherapyBand ? 30 : 60;

      showResult(
        "alert",
        `
          <strong>Phototherapy Indicated</strong>
          <br><br>
          Bilirubin is <strong>${bilirubinDisplay} ${UNIT}</strong>,
          within the phototherapy range of
          <strong>${row.photoLow}–${row.photoHigh} ${UNIT}</strong>.
          <br><br>
          <strong>Recommended action:</strong>
          ${phototherapyType}.
          <br><br>
          <em>IVF Guidance:</em>
          Consider ${ivfPercent}% of required maintenance fluids if clinically appropriate and in keeping with local protocol.
        `
      );
    } else if (bilirubin >= row.repeat) {
      showResult(
        "warning",
        `
          <strong>Repeat Serum Bilirubin</strong>
          <br><br>
          Bilirubin is <strong>${bilirubinDisplay} ${UNIT}</strong>.
          This is at or above the repeat serum bilirubin threshold of
          <strong>${row.repeat} ${UNIT}</strong>,
          but below the phototherapy threshold.
          <br><br>
          <strong>Recommended action:</strong>
          Repeat serum bilirubin in 6–8 hours.
        `
      );
    } else {
      showResult(
        "success",
        `
          <strong>Below Action Threshold on This Chart</strong>
          <br><br>
          Bilirubin is <strong>${bilirubinDisplay} ${UNIT}</strong>,
          which is below the repeat serum bilirubin threshold of
          <strong>${row.repeat} ${UNIT}</strong>
          for this birthweight and age band.
          <br><br>
          Continue clinical assessment, feeding support, and routine monitoring as appropriate.
        `
      );
    }

    displayReferenceSheet(birthweight, row);

    recalculateBtn.style.display = "block";
  });

  recalculateBtn.addEventListener("click", function () {
    form.reset();

    resultDiv.style.display = "none";
    ageResultDiv.style.display = "none";
    referenceSheetDiv.style.display = "none";
    recalculateBtn.style.display = "none";

    resultDiv.innerHTML = "";
    ageDisplayDiv.textContent = "";
    referenceSheetDiv.innerHTML = "";
  });
});


