const $form = $(".box");
const $input = $form.find('input[type="file"]');
const $label = $form.find("label");
const $tableID = $("#table");
const $BTN = $("#export-btn");
const $EXPORT = $("#export");
const toastOptions = {
  animation: true,
  autohide: true,
  delay: 2000,
};
const $toast = $(".toast");
$toast.toast();
let excelData = [];
let parsedExcelData = [];

let tableRows;
const newTr = `
<tr>
  <td class="pt-3-half" contenteditable="true">Example</td>
  <td class="pt-3-half" contenteditable="true">Example</td>
  <td class="pt-3-half" contenteditable="true">Example</td>
  <td class="pt-3-half" contenteditable="true">Example</td>
  <td class="pt-3-half" contenteditable="true">Example</td>
  <td class="pt-3-half">
    <span class="table-up"><a href="#!" class="indigo-text"><i class="fas fa-long-arrow-alt-up" aria-hidden="true"></i></a></span>
    <span class="table-down"><a href="#!" class="indigo-text"><i class="fas fa-long-arrow-alt-down" aria-hidden="true"></i></a></span>
  </td>
  <td>
    <span class="table-remove"><button type="button" class="btn btn-danger btn-rounded btn-sm my-0 waves-effect waves-light">Remove</button></span>
  </td>
</tr>`;

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

function ExcelDateToJSDate(serial) {
  var utc_days = Math.floor(serial - 25569);
  var utc_value = utc_days * 86400;
  var date_info = new Date(utc_value * 1000);

  var fractional_day = serial - Math.floor(serial) + 0.0000001;

  var total_seconds = Math.floor(86400 * fractional_day);

  var seconds = total_seconds % 60;

  total_seconds -= seconds;

  var hours = Math.floor(total_seconds / (60 * 60));
  var minutes = Math.floor(total_seconds / 60) % 60;

  let dateObject = new Date(
    date_info.getFullYear(),
    date_info.getMonth(),
    date_info.getDate(),
    hours,
    minutes,
    seconds
  );
  return `${date_info.getMonth()}/${date_info.getDate()}/${date_info.getFullYear()}`;
}

const isAdvancedUpload = (function () {
  var div = document.createElement("div");
  return (
    ("draggable" in div || ("ondragstart" in div && "ondrop" in div)) &&
    "FormData" in window &&
    "FileReader" in window
  );
})();

const showFiles = function (files) {
  $label.text(files[0].name);
  $toast.toast("show");
};

const validateSheet = async function (sheet) {
  //Set of employees
  console.log("Validate Sheets");
  let employeeNames = new Set([]);
  sheet.forEach((eachRow) => {
    employeeNames.add(eachRow.Person);
  });
  //Set of customers
  let customerNames = new Set([]);
  sheet.forEach((eachRow) => {
    customerNames.add(eachRow.Customer);
  });

  //console.log("[Employee Names]", employeeNames);
  //console.log("[Customer Names]", customerNames);

  // Resolve Employees 1st, then Customers, and then finally the Efforts
  let employees = {};
  let customers = {};
  let validateEmployeeEffort = {};

  // await asyncForEach(Array.from(employeeNames), async (eachEmp) => {
  //   await $.get("/getEmployeeInfo?eachEmp=" + eachEmp, function (data) {
  //     var res = JSON.parse(data);
  //     employees["" + eachEmp] = res === "failed" ? res : res.id;
  //   });
  // });

  // await asyncForEach(Array.from(customerNames), async (eachCus) => {
  //   await $.get("/getCustomersInfo?eachCus=" + eachCus, function (data) {
  //     var res = JSON.parse(data);
  //     customers["" + customers] = res === "failed" ? res : res.id;
  //   });
  // });

  await asyncForEach(Array.from(employeeNames), async (eachEmp) => {
    try {
      const response = await fetch("/getEmployeeInfo?eachEmp=" + eachEmp);
      const data = await response.json();
      //console.log(data);
      employees["" + eachEmp] = data === "failed" ? data : data.id;
    } catch (error) {
      console.log(error);
    }
  });

  await asyncForEach(Array.from(customerNames), async (eachCus) => {
    try {
      const response = await fetch("/getCustomersInfo?eachCus=" + eachCus);
      const data = await response.json();
      //console.log(data);
      customers["" + eachCus] = data === "failed" ? data : data.id;
    } catch (error) {
      console.log(error);
    }
  });

  //console.log("[Employees]", employees);
  //console.log("[Customers]", customers);

  sheet.forEach((tsRow, idx) => {
    //console.log(tsRow)
    const parsedDate = XLSX.SSF.parse_date_code(tsRow.Date);
    const { d, m, y } = parsedDate;
    const inputDate = `${m}/${d}/${y}`;
    const outputDate = inputDate
      .replace(/(\d\d)\/(\d\d)\/(\d{4})/, "$3/$1/$2")
      .toString();
    const empName = tsRow.Person.toString();
    const empID = employees[empName].toString();
    const cusName = tsRow.Customer.toString();
    const cusID = customers[cusName].toString();
    const effort = tsRow.Hours.toString();
    const hlyRate = tsRow.HourlyRate.toString();
    const desc = tsRow.Budget.toString();
    const billableStatus = hlyRate >= 1 ? "Billable" : "NotBillable";
    const samplePayload = {
      TxnDate: outputDate,
      EmployeeRefVal: empID,
      EmployeeName: empName,
      CustomerRefVal: cusID,
      CustomerName: cusName,
      Hours: effort,
      Description: desc,
      BillableStatus: billableStatus,
      HourlyRate: hlyRate,
    };
    parsedExcelData.push(samplePayload)
    validateEmployeeEffort[empName + outputDate + billableStatus] =
      (validateEmployeeEffort[empName + outputDate + billableStatus]
        ? validateEmployeeEffort[empName + outputDate + billableStatus]
        : 0) + parseInt(effort);
    let validationErrors = [];
    if (validateEmployeeEffort[empName + outputDate + billableStatus] > 8) {
      //console.log("[Row error index]", idx)
      validationErrors.push("Total Effort for an Employee towards a customer cannot be more than 8 hours")
    }
  });
  console.log("[Sample Payload]", parsedExcelData)
  console.log("[Validated employee effort]", validateEmployeeEffort);
};

const parseSheets = function (workbook, sheets) {
  return sheets.map((element) => {
    const roa = XLSX.utils.sheet_to_json(workbook.Sheets[element]);
    console.log(roa);
    if (roa.length > 0) {
      return roa;
    }
  });
};

const parseXLSX = function (file) {
  console.log("Here");
  let reader = new FileReader();
  reader.addEventListener("load", async (event) => {
    const fileData = event.target.result;
    const workBook = XLSX.read(fileData, { type: "binary" });
    const sheetNameList = workBook.SheetNames;
    console.log("[Sheet Names]", sheetNameList);
    excelData = parseSheets(workBook, sheetNameList);
    console.log("[Excel Data]", excelData);
    await validateSheet(excelData[0]);
    populateTable();
  });
  reader.readAsBinaryString(file);
};

const populateTable = function () {
  if ($tableID.find("tbody tr").length === 0) {
    let template = ``;
    parsedExcelData.forEach((element, idx) => {
      template =
        template +
        `<tr>
            <td class="pt-3-half" contenteditable="true">${element.TxnDate}</td>
            <td class="pt-3-half" contenteditable="true">${element.Hours}</td>
            <td class="pt-3-half" contenteditable="true">${element.EmployeeName}</td>
            <td class="pt-3-half" contenteditable="true">${element.Description}</td>
            <td class="pt-3-half" contenteditable="true">${element.CustomerName}</td>
            <td class="pt-3-half" contenteditable="true">${element.HourlyRate}</td>
            <td>
              <span class="table-remove"><button type="button" class="btn btn-danger btn-rounded btn-sm my-0 waves-effect waves-light">Remove</button></span>
            </td>
          </tr>`;
    });
    $("tbody").append(template);
  }
};

if (isAdvancedUpload) {
  $form.addClass("has-advanced-upload");

  let droppedFiles = false;

  $form
    .on("drag dragstart dragend dragover dragenter dragleave drop", function (
      e
    ) {
      e.preventDefault();
      e.stopPropagation();
    })
    .on("dragover dragenter", function () {
      $form.addClass("is-dragover");
    })
    .on("dragleave dragend drop", function () {
      $form.removeClass("is-dragover");
    })
    .on("drop", function (e) {
      droppedFiles = e.originalEvent.dataTransfer.files;
      //console.log(droppedFiles);
      showFiles(droppedFiles);
      parseXLSX(droppedFiles[0]);
    });
  //   .on("submit", function (e) {
  //     if ($form.hasClass("is-uploading")) return false;

  //     $form.addClass("is-uploading").removeClass("is-error");

  //     if (isAdvancedUpload) {
  //       e.preventDefault();

  //       var ajaxData = new FormData($form.get(0));

  //       if (droppedFiles) {
  //         $.each(droppedFiles, function (i, file) {
  //           ajaxData.append($input.attr("name"), file);
  //         });
  //       }

  //       $.ajax({
  //         url: $form.attr("action"),
  //         type: $form.attr("method"),
  //         data: ajaxData,
  //         dataType: "json",
  //         cache: false,
  //         contentType: false,
  //         processData: false,
  //         complete: function () {
  //           $form.removeClass("is-uploading");
  //         },
  //         success: function (data) {
  //           $form.addClass(data.success == true ? "is-success" : "is-error");
  //           if (!data.success) $errorMsg.text(data.error);
  //         },
  //         error: function () {
  //           // Log the error, show an alert, whatever works for you
  //         },
  //       });
  //     } else {
  //       // ajax for legacy browsers
  //     }
  //   });

  $input.on("change", function (e) {
    showFiles(e.target.files);
    console.log(e.target.files);
    parseXLSX(e.target.files[0]);
  });
}

// $('.table-add').on('click', 'i', () => {

//     const $clone = $tableID.find('tbody tr').last().clone(true).removeClass('hide table-line');

//     if ($tableID.find('tbody tr').length === 0) {

//       $('tbody').append(newTr);
//     }

//     $tableID.find('table').append($clone);
//   });

$tableID.on("click", ".table-remove", function () {
  $(this).parents("tr").detach();
});

$tableID.on("click", ".table-up", function () {
  const $row = $(this).parents("tr");

  if ($row.index() === 0) {
    return;
  }

  $row.prev().before($row.get(0));
});

$tableID.on("click", ".table-down", function () {
  const $row = $(this).parents("tr");
  $row.next().after($row.get(0));
});

// A few jQuery helpers for exporting only
jQuery.fn.pop = [].pop;
jQuery.fn.shift = [].shift;

$BTN.on("click", () => {
  const $rows = $tableID.find("tr:not(:hidden)");
  const headers = [];
  const data = [];

  // Get the headers (add special header logic here)
  $($rows.shift())
    .find("th:not(:empty)")
    .each(function () {
      headers.push($(this).text().toLowerCase());
    });

  // Turn all existing rows into a loopable array
  $rows.each(function () {
    const $td = $(this).find("td");
    const h = {};

    // Use the headers from earlier to name our hash keys
    headers.forEach((header, i) => {
      h[header] = $td.eq(i).text();
    });

    data.push(h);
  });

  // Output the result
  $EXPORT.text(JSON.stringify(data));
});
