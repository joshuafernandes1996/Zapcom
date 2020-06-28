const $form = $(".box");
const $app = $("#app");
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

let lookUpTableData = [];
let tableRows;
let dataTable;
let selectedCustomerId = "";

//ProgressBarInfo
let filterProgress = 0;
const $progressBarContainer = $("#progressBarContainer");
const $progressBar = $("#progressBar");
const $progressBarInfo = $("#progressBarInfo");

const setProgressPercentage = (percent) => {
  toggleBouncyBar("hidden");
  $progressBar.css("width", Math.ceil(percent)+'%');
  $progressBarInfo.html('Please wait while data is being validated ('+Math.ceil(percent)+'% Complete)');
  $app.addClass("hide")
  $progressBarContainer.css("display", "block");
  if(percent === 100){
    $progressBarInfo.html('Please wait while we load the information...');
    setTimeout(()=>{
        $app.removeClass("hide");
        $progressBarContainer.css("display", "none");
    }, 5000);

  }
};

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

const toggleBouncyBar = (bouncyBarVisibility) => {
  const bouncyBar = document.getElementById("custom-loader");
  // let bouncyBarStyle = bouncyBar.style.visibility;
  // console.log(bouncyBarStyle);
  // bouncyBar.style.visibility =
  //   bouncyBarStyle === "visible" ? "hidden" : "visible";
  bouncyBar.style.visibility = bouncyBarVisibility
};

const lookUpTableFilter = (lookUpTable, sheetRow) => {
  const filter = lookUpTable.filter((row) => {
    return row.NblyName === sheetRow.Person;
  });
  return filter[0];
};

const lookUpTableMapping = (sheet, lookUpTable) => {
  const sheetCopy = [...sheet];
  //console.log("sheetCopy", sheetCopy)
  //console.log("look up table", lookUpTable)
  return sheetCopy.map((element) => {
    const filteredRateCard = lookUpTableFilter(lookUpTable, element);
    //console.log(filteredRateCard)
    return {
      ...element,
      ...{
        Person: filteredRateCard.QBOName,
        HourlyRate: filteredRateCard.RateCard,
      },
    };
  });
};

const filterFiles = (array, filterRegex) => {
  const regex = new RegExp(filterRegex);
  const filter = array.filter((row) => {
    return regex.test(row.name);
  });
  return filter[0];
};

const filterExcelFiles = async (fileList) => {
  const files = [...fileList];
  try {
    const lookUpTablefile = await fileReader(
      filterFiles(files, /LookUpTable*.*(.xlsx)$/i)
    );
    if (!lookUpTablefile) {
      toggleToast({ isError: true, msg: "LookUp table not uploaded" }, true);
      return;
    }
    parseXLSX(lookUpTablefile, true, 0);
    const timesheetFile = await fileReader(
      filterFiles(files, /TimeExplorer*.*(.xlsx)$/i)
    );
    parseXLSX(timesheetFile, false, 0);
  } catch (error) {
    toggleToast({ isError: true, msg: error.msg }, true);
  }
};

const toggleToast = (data, autohide) => {
  const toastContainer = $("#toast-container");
  if (toastContainer.find("div").length > 0) {
    toastContainer.empty();
  }
  let template = ``;
  if (data.isError) {
    template = `<div class="toast" data-autohide="${autohide}" data-delay="5000">
    <div class="toast-header error-toast">
      <strong class="mr-auto">Employee TS</strong>
      <small>Just now</small>
      <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
        <span style="color:white" aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="toast-body">
      ${data.msg}
    </div>
  </div>`;
  } else {
    template = `<div class="toast" data-autohide="${autohide}" data-delay="5000">
    <div class="toast-header info-toast">
      <strong class="mr-auto">Employee TS</strong>
      <small>Just now</small>
      <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
        <span style="color:white" aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="toast-body">
      ${data.msg}
    </div>
  </div>`;
  }
  toastContainer.append(template);
  const $toast = $(".toast");
  $toast.toast("show");
};

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
  let labelString = ``;

  if (files.length > 1) {
    Array.from(files).forEach((file, idx) => {
      labelString += idx > 0 ? ` & ${file.name}` : file.name;
    });
  } else if (files.length == 1) {
    labelString = files[0].name;
  }
  $label.text(
    // files.length > 1
    //   ? ($input.attr("data-multiple-caption") || "").replace(
    //       "{count}",
    //       files.length
    //     )
    //   : files[0].name
    labelString
  );
};

const updateInArray = function (array, element) {
  const arrayCopy = [...array];
  arrayCopy.splice(element.Id, 1, element);
  return arrayCopy;
};

const deleteDataFromQuickBooks = async (dates, empDate) => {
  console.log("[Unique Dates]", dates);
  console.log("[Employee date relationship]", empDate);

  try {
    await asyncForEach(Array.from(dates), async (element,index) => {
      const response = await fetch(
        `/getTimeActivityByDate?TxnDate=${element.toString()}&CustomerId=${selectedCustomerId}`
      );
      const data = await response.json();
      if((index+1) === (Array.from(dates).length)){
            setProgressPercentage(100);
      }else{
            setProgressPercentage((index/Array.from(dates).length)*100);
      }
      if (data.error === "Failed") {
        return;
      }
      console.log(`[Timesheet by date: ${element}]`, data);

      const filteredData = data.filter((row) => {
        //return row.employeeRef.value == empDate[element]
        return empDate.find(
          (value) =>
            value[element] === row.employeeRef.value &&
            row.customerRef.value === selectedCustomerId
        );
      });
      console.log("[Filtered timesheet]", filteredData);

      await asyncForEach(filteredData, async (element) => {
        const response = await fetch(
          `/deleteTimeActivity/${element.id.toString()}/${element.syncToken}`
        );
        const data = await response.json();
      });
    });
  } catch (error) {
    throw error;
  }
};

const validateSheet = async function (sheet, isFirst) {
  toggleBouncyBar("visible");
  if(isFirst)setProgressPercentage(0);
  let customData = {};
  //$("#validate-toast").toast("show");
  toggleToast({ msg: "Validating Data.. Please Wait" }, true);
  //Set of employees
  console.log("Validate Sheets");
  let employeeNames = new Set([]);
  sheet.forEach((eachRow) => {
    employeeNames.add(eachRow.Person);
  });

  //Set of dates
  let timeSheetDates = new Set([]);
  sheet.forEach((eachRow) => {
    timeSheetDates.add(excelDatetoJSDate(eachRow.Date, "-"));
  });

  //console.log("[Employee Names]", employeeNames);
  //console.log("[Customer Names]", customerNames);
  //console.log("[Timesheet dates]", timeSheetDates);

  // Resolve Employees 1st, then Customers, and then finally the Efforts
  let employees = {};
  let validateEmployeeEffort = {};

  await asyncForEach(Array.from(employeeNames), async (eachEmp) => {
    try {
      const response = await fetch("/getEmployeeInfo?eachEmp=" + eachEmp);
      const data = await response.json();
      //console.log(data);
      //employees["" + eachEmp] = data === "failed" ? data : data.id;
      if (data.error === "failed") {
        toggleToast(
          {
            isError: true,
            msg: `Employee: ${eachEmp} doesn't exist in quickbooks`,
          },
          true
        );
      } else {
        employees["" + eachEmp] = data.id;
      }
    } catch (error) {
      console.log(error);
    }
  });

  //console.log("[Employees]", employees);
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
    const cusID = selectedCustomerId.toString();
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
    //console.log(roa);
    if (roa.length > 0) {
      return roa;
    }
  });
};

const validateSheetColumns = (sheetData, columnRef) => {
  const lookupSheetColumns = Object.keys(sheetData[0]);
  return columnRef.every((column) => lookupSheetColumns.includes(column));
};

const parseXLSX = async (file, isLookup, idx) => {
  const workBook = XLSX.read(file, { type: "binary" });
  const sheetNameList = workBook.SheetNames;
  if (isLookup) {
    const tempLookupData = parseSheets(workBook, sheetNameList)[idx];
    const lookupColumnRef = ["NblyName", "QBOName", "RateCard"];
    const isColumnKeysValidated = validateSheetColumns(
      tempLookupData,
      lookupColumnRef
    );
    isColumnKeysValidated
      ? (lookUpTableData = tempLookupData)
      : toggleToast(
          {
            isError: true,
            msg: "Columns missing in Lookup table file.",
          },
          true
        );
  } else {
    const excelData = parseSheets(workBook, sheetNameList)[idx];
    //console.log(excelData[idx])
    const timesheetColumnRef = ["Date", "Hours", "Person", "Budget"];
    const isColumnKeysValidated = validateSheetColumns(
      excelData,
      timesheetColumnRef
    );
    if (isColumnKeysValidated) {
      const mappedData = lookUpTableMapping(excelData, lookUpTableData);
      //console.log("[Mapped Data]", mappedData)
      const validatedData = await validateSheet(mappedData, true);
      populateTable(validatedData);
    } else {
      toggleToast(
        { isError: true, msg: "Columns missing in timesheet file" },
        true
      );
    }
  }
};

const fileReader = (file) => {
  // console.log("Here");
  // //toggleBouncyBar();
  // reader.addEventListener("load", async (event) => {
  //   const fileData = event.target.result;
  //   const workBook = XLSX.read(fileData, { type: "binary" });
  //   const sheetNameList = workBook.SheetNames;
  //   console.log("[Sheet Names]", sheetNameList);
  //   if(file.name === "LookUpTable.xlsx") {
  //     lookUpTableData = parseSheets(workBook, sheetNameList)
  //   } else {
  //     excelData = parseSheets(workBook, sheetNameList);
  //     console.log("[Excel Data]", excelData);
  //     const validatedData = await validateSheet(excelData[idx], true);
  //     populateTable(validatedData);
  //   }
  // });
  // reader.readAsBinaryString(file);

  const temporaryFileReader = new FileReader();

  return new Promise((resolve, reject) => {
    temporaryFileReader.onerror = () => {
      temporaryFileReader.abort();
      reject(new DOMException("Problem parsing input file."));
    };

    temporaryFileReader.onload = () => {
      resolve(temporaryFileReader.result);
    };
    temporaryFileReader.readAsBinaryString(file);
  });
};

const batchPostTimeActivity = async (batchPayload) => {
  try {
    const response = await fetch("/commitEffort", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batchPayload),
    });
    console.log(await response.json());
  } catch (error) {
    console.log(error);
  }
};

const reinitializeTable = (validatedData) => {
  dataTable.clear().destroy();
  $tableID.find("tbody").empty();
  dataTable = undefined;
  populateTable(validatedData);
};

const populateTable = function (validatedData) {
  let { payload } = validatedData;
  if (dataTable) {
    dataTable.clear().draw();
    dataTable.rows.add(payload);
    dataTable.columns.adjust().draw();
  } else {
    dataTable = $("#data-table").DataTable({
      responsive: {
        details: {
          type: "column",
        },
      },
      data: payload,
      dom:
        "<'row mb-3'<'col-sm-12 col-md-6'B>><'row'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6'f>>" +
        "<'row'<'col-sm-12'tr>>" +
        "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
      pageLength: 30,
      pagingType: "full_numbers",
      lengthChange: true,
      lengthMenu: [10, 30, 50, 75, 100],
      buttons: [
        {
          text: "Edit",
          action: function () {
            const selectedRow = dataTable
              .rows({ selected: true })
              .data()
              .toArray();
            //console.log(selectedRow);
            const {
              Id,
              TxnDate,
              Person,
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
          attr: {
            id: "btn-submit",
          },
          action: async function () {
            const tableData = dataTable.rows().data().toArray();
            console.log(tableData);
            const data = await validateSheet(tableData);

            if (data.hasErrors) {
              //$("#sub-error-toast").toast("show");
              toggleToast(
                {
                  isError: true,
                  msg:
                    "Submit Failed. There seems to be some conflicts in your data.",
                },
                true
              );
              //dataTable.clear().rows.add(data.payload).draw();
              reinitializeTable(data);
            } else {
              toggleBouncyBar("visible");
              document.getElementById("btn-submit").disabled = true;
              const { payload } = data;
              // await asyncForEach(data.payload, async (element) => {
              //   const {
              //     TxnDate,
              //     EmployeeRefVal,
              //     CustomerRefVal,
              //     Hours,
              //     Description,
              //     BillableStatus,
              //     HourlyRate,
              //   } = element;
              //   const samplePayload = {
              //     TxnDate: TxnDate,
              //     RmployeeRefVal: EmployeeRefVal,
              //     CustomerRefVal: CustomerRefVal,
              //     Hours: Hours,
              //     Description: Description,
              //     BillableStatus: BillableStatus,
              //     HourlyRate: HourlyRate,
              //   };
              //   //console.log("[Payload]", payload);
              //   try {
              //     const response = await fetch("/commitEffort", {
              //       method: "POST",
              //       headers: {
              //         "Content-Type": "application/json",
              //       },
              //       body: JSON.stringify(samplePayload),
              //     });
              //     console.log(await response.json());
              //   } catch (error) {
              //     console.log(error);
              //   }
              // });
              let batchPayload = [];
              //payload.forEach((timeActivity, idx, array) => {
              await asyncForEach(payload, async (timeActivity, idx, array) => {
                const {
                  TxnDate,
                  EmployeeRefVal,
                  CustomerRefVal,
                  Hours,
                  Description,
                  BillableStatus,
                  HourlyRate,
                } = timeActivity;
                const samplePayload = {
                  txnDate: TxnDate,
                  employeeRefVal: EmployeeRefVal,
                  customerRefVal: CustomerRefVal,
                  hours: Hours,
                  description: Description,
                  billableStatus: BillableStatus,
                  hourlyRate: HourlyRate,
                };
                batchPayload.push(samplePayload);
                if (batchPayload.length == 30 || idx == payload.length - 1) {
                  await batchPostTimeActivity(batchPayload);
                  batchPayload = [];
                }
              });
              toggleBouncyBar("hidden");
              //$("#sub-success-toast").toast("show");
              toggleToast(
                { msg: "Successfully pushed data to QuickBooks" },
                true
              );
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
  //$("#validate-toast").hide();
  toggleBouncyBar("hidden");
  $('[data-toggle="tooltip"]').tooltip();

  $("#btn-edit").on("click", async function (e) {
    e.preventDefault();
    const id = $("#row-id").val();
    const editedRow = {
      Id: parseInt(id),
      TxnDate: $("#date").val(),
      Person: $("#person").val(),
      EmployeeRefVal: $("#employee-id").val(),
      CustomerRefVal: $("#customer-id").val(),
      Hours: $("#hours").val(),
      Description: $("#budget").val(),
      BillableStatus: $("#billable-status").val(),
      HourlyRate: $("#hourlyRate").val(),
    };
    payload = updateInArray(payload, editedRow);
    //dataTable.row(id).data(editedRow).invalidate().draw();
    // dataTable.clear().draw();
    // dataTable.rows.add(payload);
    // dataTable.columns.adjust().draw();
    $editModal.modal("hide");
    const validatedData = await validateSheet(payload, false);
    reinitializeTable(validatedData);
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
      //parseXLSX(droppedFiles[0]);
      if (droppedFiles.length == 2) {
        console.log("2 files selected", droppedFiles);
        filterExcelFiles(droppedFiles);
      } else {
        toggleToast({ isError: true, msg: "Upload 2 excel files" }, true);
      }
    });

  $input.on("change", function (e) {
    const files = e.target.files;
    showFiles(e.target.files);
    //console.log(e.target.files);
    //parseXLSX(e.target.files[0]);
    if (files.length == 2) {
      console.log("2 files selected", files);
      filterExcelFiles(files);
    } else {
      toggleToast({ isError: true, msg: "Upload 2 excel files" }, true);
    }
  });
}

$(document).ready(async function () {
  //$("#progressLoader").addClass("showElement").removeClass("hideElement");
  $selectBtn.attr("disabled", true);
  //$selectBtn.addClass("hideElement").removeClass("custom-select");

  try {
    toggleToast({ msg: "Fetching list of customers" }, true);
    const response = await fetch("/getCustomers");
    const data = await response.json();
    let reducedData = [];
    let isDwyerFound = false;
    const companyRegex = new RegExp(/Bill's*.*/);
    data.map((item) => {
      reducedData.push({ id: item.id, companyName: item.companyName });
    });
    console.log("---DATA---");
    console.log(reducedData);
    $selectBtn
      .append(
        reducedData.map(function (v) {
          if (v.companyName !== null) {
            if (companyRegex.test(v.companyName)) {
              selectedCustomerId = v.id;
              isDwyerFound = true;
              return $("<option/>", {
                value: v.id,
                text: v.companyName,
                selected: true,
              });
            } else {
              return $("<option/>", {
                value: v.id,
                text: v.companyName,
              });
            }
          }
        })
      )
      .change(function () {
        console.log(this.value);
      });

    if (isDwyerFound) {
      $("#dropBox").removeClass("hideDropBox");
      $selectBtn.attr("disabled", true);
    } else {
      $selectBtn.attr("disabled", false);
    }
    //$selectBtn.attr("disabled", false);
    //$selectBtn.removeClass("hideElement").addClass("custom-select");
    //$("#progressLoader").addClass("hideElement").removeClass("showElement");
    toggleBouncyBar("hidden");
  } catch (error) {
    console.log(error);
    $selectBtn.attr("disabled", false);
    //$selectBtn.removeClass("hideElement").addClass("custom-select");
    //$("#progressLoader").addClass("hideElement").removeClass("showElement");
  }
});

$selectBtn.on("change", function (e) {
  console.log(e.target.value);
  if (e.target.value === "") {
    $("#dropBox").addClass("hideDropBox");
  } else {
    $("#dropBox").removeClass("hideDropBox");
    selectedCustomerId = e.target.value;
  }
});
