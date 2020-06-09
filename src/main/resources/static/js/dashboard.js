const $form = $(".box");
const $input = $form.find('input[type="file"]');
const $label = $form.find("label");
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
      console.log(droppedFiles);
      showFiles(droppedFiles);
    });

  $input.on("change", function (e) {
    showFiles(e.target.files);
  });
  // .on("submit", function (e) {
  //   if ($form.hasClass("is-uploading")) return false;

  //   $form.addClass("is-uploading").removeClass("is-error");

  //   if (isAdvancedUpload) {
  //     e.preventDefault();

  //     var ajaxData = new FormData($form.get(0));

  //     if (droppedFiles) {
  //       $.each(droppedFiles, function (i, file) {
  //         ajaxData.append($input.attr("name"), file);
  //       });
  //     }

  //     $.ajax({
  //       url: $form.attr("action"),
  //       type: $form.attr("method"),
  //       data: ajaxData,
  //       dataType: "json",
  //       cache: false,
  //       contentType: false,
  //       processData: false,
  //       complete: function () {
  //         $form.removeClass("is-uploading");
  //       },
  //       success: function (data) {
  //         $form.addClass(data.success == true ? "is-success" : "is-error");
  //         if (!data.success) $errorMsg.text(data.error);
  //       },
  //       error: function () {
  //         // Log the error, show an alert, whatever works for you
  //       },
  //     });
  //   } else {
  //     // ajax for legacy browsers
  //   }
  // });
}
