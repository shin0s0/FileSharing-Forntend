const dropZone = document.querySelector(".drop-zone");
const fileInput = document.querySelector("#fileinput");
const browseBtn = document.querySelector(".browsebtn");

const bgProgress = document.querySelector(".bg-progress");
const percentDiv = document.querySelector("#percent");
const progressBar = document.querySelector(".progress-bar");
const progressContainer = document.querySelector(".progress-container");

const fileURL = document.querySelector("#fileURL");
const sharingContainer = document.querySelector(".sharing-container");
const copyBtn = document.querySelector("#copyBtn");

const emailForm = document.querySelector("#emailForm");

const toast = document.querySelector(".toast");

let dragCounter = 0;
const maxAllowedSize = 100 * 1024 * 1024;

const host = 'https://busy-yak-tux.cyclic.app/';
const uploadURL = `${host}/api/files`; 
const emailURL = `${host}/api/files/send`; 

dropZone.addEventListener("dragenter", (e) => {
    e.preventDefault();
    dragCounter++;
    if (!dropZone.classList.contains("dragged")) {
        dropZone.classList.add("dragged");
        console.log("dragging");
    }
});

dropZone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
        dropZone.classList.remove("dragged");
        console.log("removing");
    }
});

dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    console.log("drag over");
});

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragged");
    console.log("dropped");
    const files = e.dataTransfer.files;
    console.log(files);
    if (files.length) {
        fileInput.files = files;
        uploadFile();
    }
});

fileInput.addEventListener("change", () => {
    uploadFile();
});

browseBtn.addEventListener("click", () => {
    fileInput.click();
});

copyBtn.addEventListener("click", () => {
    const textToCopy = fileURL.value;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                showToast("Link Copied");
            })
            .catch((error) => {
                console.error("Clipboard writeText failed:", error);
            });
    } else {
        try {
            fileURL.select();
            document.execCommand("copy");
            showToast("Link Copied");
        } catch (error) {
            console.error("Fallback copy failed:", error);
        }
    }
});

const uploadFile = () => {
    if (fileInput.files.length > 1) {
        resetFileInput();
        showToast("Only upload 1 file!");
        return;
    }
    const file = fileInput.files[0]; 
    if (file.size > maxAllowedSize) {
        showToast("Can't upload more than 100MB!");
        resetFileInput();
        return;
    }
    progressContainer.style.display = "block";

    const formData = new FormData();
    formData.append("myfile", file);

    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            const response = JSON.parse(xhr.response);
            onUploadSuccess(response, file); 
        }
    };
    

    xhr.upload.onprogress = updateProgress;
    xhr.upload.onerror = () => {
        resetFileInput();
        showToast(`Error in upload: ${xhr.statusText}`);
    };
    xhr.open("POST", uploadURL);
    xhr.send(formData);
};

const updateProgress=(e)=>{
    const percent= Math.round((e.loaded /e.total) *100);
    bgProgress.style.width=`${percent}%`;
    percentDiv.innerText= percent;
    progressBar.style.transform= `scaleX(${percent/100})`;
}

const onUploadSuccess = (response, file) => {
    resetFileInput();
    emailForm[2].removeAttribute("disabled");
    progressContainer.style.display = "none";
    sharingContainer.style.display = "block";
    fileURL.value = response.file; 
};

const resetFileInput= () =>{
    fileInput.value="";
}


emailForm.addEventListener("submit", (e) => {
    e.preventDefault(); 
    emailForm[2].setAttribute("disabled", "true");
    emailForm[2].innerText = "Sending";
    const url = fileURL.value; 

    const formData = {
        uuid: url.split("/").splice(-1, 1)[0],
        emailTo: emailForm.elements["to-email"].value,
        emailFrom: emailForm.elements["from-email"].value,
    };

    fetch(emailURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
    })
    .then((res) => {
        if (res.status === 200) {
                showToast("Email Sent");
                sharingContainer.style.display = "none";
            } else {
                showToast("Failed : An unexpected error occured ");
            }
        });
});


    let toastTimer;
    const showToast = (msg) => {
        toast.innerText = msg;
        toast.style.top = '30px';
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.style.top = '-80px'; 
        }, 2000);
    };
    