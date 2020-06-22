const $form = $(".box");
const $input = $form.find('input[type="file"]');
const $label = $form.find("label");
const $tableID = $("#table");
const $BTN = $("#export-btn");
const $EXPORT = $("#export");
const $editModal = $("#edit-modal");
const $selectBtn = $("#customerSelect");
const toastOptions = {
  animation: true,
  autohide: true,
  delay: 2000,
};
const $toast = $(".toast");
$toast.toast();
let excelData = [];
let tableRows;
let dataTable;
let selectedCustomerId = "";

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

// function ExcelDateToJSDate(serial) {
//   var utc_days = Math.floor(serial - 25569);
//   var utc_value = utc_days * 86400;
//   var date_info = new Date(utc_value * 1000);

//   var fractional_day = serial - Math.floor(serial) + 0.0000001;

//   var total_seconds = Math.floor(86400 * fractional_day);

//   var seconds = total_seconds % 60;

//   total_seconds -= seconds;

//   var hours = Math.floor(total_seconds / (60 * 60));
//   var minutes = Math.floor(total_seconds / 60) % 60;

//   let dateObject = new Date(
//     date_info.getFullYear(),
//     date_info.getMonth(),
//     date_info.getDate(),
//     hours,
//     minutes,
//     seconds
//   );
//   return `${date_info.getMonth()}/${date_info.getDate()}/${date_info.getFullYear()}`;
// }

const excelDatetoJSDate = (serial, seperator) => {
  const pad = (n) => {
    return n < 10 ? "0" + n : n;
  };
  const date = XLSX.SSF.parse_date_code(serial);
  const { d, m, y } = date;
  const parsed = `${y}${seperator}${pad(m)}${seperator}${pad(d)}`;
  return parsed;
};

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
};

const updateInArray = function (array, element) {
  const arrayCopy = [...array];
  arrayCopy.splice(element.Id, 1, element);
  return arrayCopy;
};

const deleteDataFromQuickBooks = async (dates, empDate) => {
  dates.forEach(async (element) => {
    const response = await fetch(
      `/getTimeActivityByDate?TxnDate=${element.toString()}&CustomerId=${selectedCustomerId}`
    );
    const data = await response.json();
    console.log("[Timesheet by date]", data);

    const filteredData = data.filter((row) => {
      //return row.employeeRef.value == empDate[element]
      return empDate.find((value) => value[element] === row.employeeRef.value);
    });
    console.log("[Filtered timesheet]", filteredData);

    filteredData.forEach(async (element) => {
      try {
        const response = await fetch(
          `/deleteTimeActivity/${element.id.toString()}/${element.syncToken}`
        );
        const data = response.json();
      } catch (error) {
        throw error;
      }
    });
  });
};

const validateSheet = async function (sheet, isFirst) {
  let customData = {};
  $("#validate-toast").toast("show");

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

  //Set of dates
  let timeSheetDates = new Set([]);
  sheet.forEach((eachRow) => {
    timeSheetDates.add(excelDatetoJSDate(eachRow.Date, "-"));
  });

  //console.log("[Employee Names]", employeeNames);
  //console.log("[Customer Names]", customerNames);
  console.log("[Timesheet dates]", timeSheetDates);

  // Resolve Employees 1st, then Customers, and then finally the Efforts
  let employees = {};
  let customers = {};
  let validateEmployeeEffort = {};

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

  console.log("[Employees]", employees);
  //console.log("[Customers]", customers);

  // let empDates = new Set([]);
  // sheet.forEach((eachRow) => {
  //   empDates.add({
  //     empId: employees[eachRow.Person],
  //     date: excelDatetoJSDate(eachRow.Date, "-"),
  //   });
  // });

  if (isFirst) {
    try {
      let empDates = [];
      sheet.forEach((eachRow) => {
        //empDates[excelDatetoJSDate(eachRow.Date, "-")] = employees[eachRow.Person]
        const date = excelDatetoJSDate(eachRow.Date, "-");
        const data = {};
        data[date] = employees[eachRow.Person];
        const x = empDates.find((item) => item[date] === data[date]);
        if (!x) {
          empDates.push(data);
        }
      });

      console.log("[emp dates]", empDates);
      const data = await deleteDataFromQuickBooks(timeSheetDates, empDates);
    } catch (error) {
      console.log(error);
    }
  }

  let samplePayloads = [];
  let rowErrors = {};
  sheet.forEach((tsRow, idx) => {
    //console.log(tsRow)
    let validationErrors = [];
    let outputDate;
    if (tsRow.Date) {
      const parsedDate = XLSX.SSF.parse_date_code(tsRow.Date);
      const { d, m, y } = parsedDate;
      const inputDate = `${m}/${d}/${y}`;
      outputDate = inputDate
        .replace(/(\d\d)\/(\d\d)\/(\d{4})/, "$3/$1/$2")
        .toString();
    } else {
      outputDate = tsRow.TxnDate.replace(
        /(\d\d)\/(\d\d)\/(\d{4})/,
        "$3/$1/$2"
      ).toString();
    }
    const empName = tsRow.Person.toString();
    const empID = employees[empName].toString();
    const cusName = tsRow.Customer.toString();
    const cusID = customers[cusName].toString();
    const effort = tsRow.Hours.toString();
    const hlyRate = tsRow.HourlyRate.toString();
    const desc = tsRow.Budget
      ? tsRow.Budget.toString()
      : tsRow.Description.toString();
    const billableStatus = hlyRate >= 1 ? "Billable" : "NotBillable";
    const samplePayload = {
      Id: idx,
      TxnDate: outputDate,
      EmployeeRefVal: empID,
      Person: empName,
      CustomerRefVal: cusID,
      Customer: cusName,
      Hours: effort,
      Description: desc,
      BillableStatus: billableStatus,
      HourlyRate: hlyRate,
    };
    samplePayloads.push(samplePayload);
    validateEmployeeEffort[empName + outputDate + billableStatus] =
      (validateEmployeeEffort[empName + outputDate + billableStatus]
        ? validateEmployeeEffort[empName + outputDate + billableStatus]
        : 0) + parseInt(effort);
    if (validateEmployeeEffort[empName + outputDate + billableStatus] > 8) {
      //console.log("[Row error index]", idx)
      validationErrors.push(
        "Total Effort for an Employee towards a customer cannot be more than 8 hours"
      );
      rowErrors[idx] = validationErrors;
    }
  });

  if (!jQuery.isEmptyObject(rowErrors)) {
    customData["hasErrors"] = true;
    customData["errors"] = rowErrors;
  } else {
    customData["hasErrors"] = false;
  }
  customData["payload"] = samplePayloads;
  console.log("[Validated payload]", customData);
  return customData;
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
    const validatedData = await validateSheet(excelData[0], true);
    populateTable(validatedData);
  });
  reader.readAsBinaryString(file);
};

const populateTable = function (validatedData) {
  let { payload } = validatedData;
  if (dataTable) {
    dataTable.clear().draw();
    dataTable.rows.add(payload);
    dataTable.columns.adjust().draw();
  } else {
    dataTable = $("#data-table").DataTable({
      responsive: true,
      data: payload,
      dom: "Bfrtip",
      buttons: [
        {
          text: "Edit",
          action: function () {
            const selectedRow = dataTable
              .rows({ selected: true })
              .data()
              .toArray();
            console.log(selectedRow);
            const {
              Id,
              TxnDate,
              Person,
              Customer,
              EmployeeRefVal,
              CustomerRefVal,
              Hours,
              Description,
              BillableStatus,
              HourlyRate,
            } = selectedRow[0];
            $("#date").val(TxnDate);
            $("#hours").val(Hours);
            $("#person").val(Person);
            $("#budget").val(Description);
            $("#customer").val(Customer);
            $("#hourlyRate").val(HourlyRate);
            $("#billable-status").val(BillableStatus);
            $("#row-id").val(Id);
            $("#employee-id").val(EmployeeRefVal);
            $("#customer-id").val(CustomerRefVal);
            $editModal.modal({ show: true });
          },
        },
        {
          text: "Delete",
          action: function () {
            dataTable.rows({ selected: true }).remove().draw();
          },
        },
        {
          text: "Submit",
          action: async function () {
            const tableData = dataTable.rows().data().toArray();
            console.log(tableData);
            const data = await validateSheet(tableData);

            if (data.hasErrors) {
              $("#sub-error-toast").toast("show");
              dataTable.clear().rows.add(data.payload).draw();
            } else {
              data.payload.forEach(async (element) => {
                const {
                  TxnDate,
                  EmployeeRefVal,
                  CustomerRefVal,
                  Hours,
                  Description,
                  BillableStatus,
                  HourlyRate,
                } = element;
                const samplePayload = {
                  txnDate: TxnDate,
                  employeeRefVal: EmployeeRefVal,
                  customerRefVal: CustomerRefVal,
                  hours: Hours,
                  description: Description,
                  billableStatus: BillableStatus,
                  hourlyRate: HourlyRate,
                };
                console.log("[Payload]", payload);
                try {
                  const response = await fetch("/commitEffort", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(samplePayload),
                  });
                  console.log(await response.json());
                } catch (error) {
                  console.log(error);
                }
              });
              $("#sub-success-toast").toast("show");
            }
          },
        },
      ],
      select: {
        style: "single",
      },
      columns: [
        {
          data: "Id",
        },
        {
          data: "TxnDate",
        },
        {
          data: "Hours",
        },
        {
          data: "EmployeeRefVal",
        },
        {
          data: "Person",
        },
        {
          data: "Description",
        },
        {
          data: "CustomerRefVal",
        },
        {
          data: "Customer",
        },
        {
          data: "HourlyRate",
        },
        {
          data: "BillableStatus",
        },
      ],
      rowid: "Id",
      rowCallback: function (row, data, displayNum, displayIndex, dataIndex) {
        if (validatedData.hasErrors) {
          const { errors } = validatedData;
          let tooltipHtmlTemplate = ``;
          if (errors[dataIndex]) {
            //console.log("[Errors]", errors[index]);
            errors[dataIndex].forEach((element) => {
              //console.log(element);
              tooltipHtmlTemplate += `<div>${element}</div>`;
            });
            row.setAttribute("data-toggle", "tooltip");
            row.setAttribute("data-html", "true");
            row.setAttribute("title", tooltipHtmlTemplate);
            row.classList.add("alert", "alert-danger");
          }
        }
      },
    });
  }
  dataTable.column(0).visible(false);
  dataTable.column(3).visible(false);
  dataTable.column(6).visible(false);
  $("#validate-toast").hide();
  $('[data-toggle="tooltip"]').tooltip();

  $("#btn-edit").on("click", function (e) {
    e.preventDefault();
    const id = $("#row-id").val();
    const editedRow = {
      Id: parseInt(id),
      TxnDate: $("#date").val(),
      Person: $("#person").val(),
      Customer: $("#customer").val(),
      EmployeeRefVal: $("#employee-id").val(),
      CustomerRefVal: $("#customer-id").val(),
      Hours: $("#hours").val(),
      Description: $("#budget").val(),
      BillableStatus: $("#billable-status").val(),
      HourlyRate: $("#hourlyRate").val(),
    };
    payload = updateInArray(payload, editedRow);
    //dataTable.row(id).data(editedRow).invalidate().draw();
    dataTable.clear().draw();
    dataTable.rows.add(payload);
    dataTable.columns.adjust().draw();
    $editModal.modal("hide");
  });
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

  $input.on("change", function (e) {
    showFiles(e.target.files);
    console.log(e.target.files);
    parseXLSX(e.target.files[0]);
  });
}

$(document).ready(async function(){
$("#progressLoader").addClass("showElement").removeClass("hideElement");
$selectBtn.addClass("hideElement").removeClass("custom-select");

 try {
      const response = await fetch("/getCustomers");
      const data = await response.json();
      let reducedData = [];
      data.map((item)=>{
        reducedData.push({id: item.id,companyName:item.companyName});
      })
      console.log("---DATA---");
      console.log(reducedData);
      $selectBtn.append(
        reducedData.map(function(v) {
        if(v.companyName !== null){
        return $('<option/>', {
                    value: v.id,
                    text: v.companyName
                  })
        }
        })
      ).change(function() {
        console.log(this.value);
      });
      $selectBtn.removeClass("hideElement").addClass("custom-select");
      $("#progressLoader").addClass("hideElement").removeClass("showElement");

    } catch (error) {
      console.log(error);
      $selectBtn.removeClass("hideElement").addClass("custom-select");
      $("#progressLoader").addClass("hideElement").removeClass("showElement");
    }
});

$selectBtn.on("change", function (e) {
  console.log( e.target.value);
  if(e.target.value === ""){
      $("#dropBox").addClass("hideDropBox");
  }else{
    $("#dropBox").removeClass("hideDropBox");
    selectedCustomerId = e.target.value;
  }
});