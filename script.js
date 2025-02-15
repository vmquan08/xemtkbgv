let subjects = {
    "Toán": "Toán",
    "văn": "Văn", 
    "ngữ": "Anh",
    "lí": "Lý",
    "Hóa": "Hóa",
    "Sinh học": "Sinh",
    "NN": "Công nghệ",
    "CN": "Công nghệ", 
    "sử": "Sử",
    "GDQP": "GDQP",
    "GDKTPL": "GDKTPL",
    "Địa": "Địa",
    "Tin": "Tin",
    "GDTC": "GDTC"
};

// lấy link tkb trên web
async function getScheduleLink() {
    try {
        const baseUrl = "https://quan08corsproxy.quan20080108.workers.dev/https://thptbencat.edu.vn";
        
        const response = await fetch(baseUrl + "/category/thoi-khoa-bieu");
        const data = await response.text();

        const parser = new DOMParser();
        const html = parser.parseFromString(data, 'text/html');
        const div = html.querySelector('.col-sm-9');
        if (div) {
            const scheduleLink = div.querySelector('a')?.getAttribute('href');
            console.log(scheduleLink);
            if (scheduleLink) {
                const scheduleResponse = await fetch(baseUrl + scheduleLink);
                const scheduleData = await scheduleResponse.text();
                
                const schedulePage = parser.parseFromString(scheduleData, 'text/html');
                const ggsheetLink = schedulePage.querySelector('a[href*="https://docs.google.com/spreadsheets/d/"]')?.href;
                
                return ggsheetLink;
            }
        }
        return null;
    } catch (error) {
        console.error("Lỗi:", error);
        return null;
    }
}
let scheduleData = [];

// Cái này để xuất dữ liệu từ link Google Sheets ra
async function loadData() {
    const ggsheetLink = await getScheduleLink();
    if (ggsheetLink) {
        const ggsheetCSVLink = ggsheetLink.replace("edit?usp=sharing", "gviz/tq?tqx=out:csv&sheet=TKBGiaovien");

        const container = document.getElementById('schedule-container');
        container.innerHTML = 'Đang tải dữ liệu...';
        
        lastTeacherName = localStorage.getItem('lastTeacherName');
        if (lastTeacherName) {
            document.getElementById('name-input').value = lastTeacherName;
        }

        try {
            const response = await fetch(ggsheetCSVLink);
            const data = await response.text();

            // xử lí dữ liệu thô
            scheduleData = data.split('\n').map(row =>
                row.split(',').map(cell => 
                    cell.trim()
                        .replace(/\r/g, '')
                        .replace(/^"/, '')  
                        .replace(/"$/, '')  
                )
            );
            container.innerHTML = '';
            console.log("Dữ liệu đã tải:", scheduleData);

            getTeacherList();
        } catch (error) {
            alert("Không thể trích xuất dữ liệu:", error);
        }
    } else {
        alert("Không tìm thấy liên kết Google Sheets");
    }
}

function getTeacherList() {
    let teacherMap = new Map();

    for (let i = 3; i < scheduleData.length; i+=16) {
        let teacherName = scheduleData[i][3];
        let foundSubject = null;

        outerLoop: for (let j = i + 2; j < i + 16; j++) {
            for (let k = 1; k < 7; k++) {
                let cell = scheduleData[j][k].toLowerCase();
                
                for (let key in subjects) {
                    if (cell.includes(key.toLowerCase())) {
                        foundSubject = (subjects[key]);
                        break outerLoop;
                    }
                }
            }
        }

        let teacherCell = foundSubject ? `${teacherName} - ${foundSubject}` : teacherName;
        teacherMap.set(teacherCell, i);
    }
    teacherList = Array.from(teacherMap.entries());
    console.log(teacherList);
    makeTeacherDatalist();
    return teacherList;
}

function makeTeacherDatalist() {
    const datalist = document.getElementById('teacher-list');

    
    teacherList.forEach(([teacherCell]) => {
        const option = document.createElement('option');
        option.value = teacherCell;
        datalist.appendChild(option);
    });
}

let teacherSchedule = [];

// Tìm tên giáo viên nhập trong placeholder và lưu lại thời khóa biểu
function searchSchedule() {
    let teacherName = document.getElementById('name-input').value.trim();
    localStorage.setItem('lastTeacherName', teacherName); // set vào localStorage

    classSchedule = [];
    let found = false;

    for (let i = 0; i < teacherList.length; i++) {
        let teacherCell = teacherList[i][0];
        if (teacherCell.includes(teacherName)) {
            teacherSchedule = scheduleData.slice(teacherList[i][1], teacherList[i][1] + 16);
            found = true;
            break;
        }
    }

    if (!found) {
        alert("Không tìm thấy tkb giáo viên đã chọn");
    } else { 
        displaySchedule();
    }
}

// Hiển thị thời khóa biểu
function displaySchedule() {
    const container = document.getElementById('schedule-container');
    container.innerHTML = '';

    if (teacherSchedule.length == 0) {
        container.innerHTML = '<p>Không có thời khóa biểu</p>';
        return;
    }

    const teacherName = teacherSchedule[0][3];
    const startTime = teacherSchedule[1][4];
    container.innerHTML = `<h2>Giáo viên: ${teacherName} - Áp dụng từ ngày ${startTime}</h2>`;
    
    //in thời khóa biểu -----------------------------------------------------------------
    container.innerHTML += `<h3>Buổi sáng</h3>`;
    
    const morningTable = document.createElement('table');
    morningTable.classList.add('table', 'table-bordered');

    for (let i = 3; i < 9; i++) {
        const tr = document.createElement('tr');

        teacherSchedule[i].slice(0, 7).forEach((cell, index) => {
            const cellElement = i === 3 ? document.createElement('th') : document.createElement('td');
            cellElement.textContent = cell;
            tr.appendChild(cellElement);
        });

        morningTable.appendChild(tr);
    }
    container.appendChild(morningTable);

    container.innerHTML += `<h3>Buổi chiều</h3>`;

    const afternoonTable = document.createElement('table');
    afternoonTable.classList.add('table', 'table-bordered');

    for (let i = 10; i < 16; i++) {
        const tr = document.createElement('tr');
        teacherSchedule[i].slice(0, 7).forEach((cell, index) => {
            const cellElement = i === 10 ? document.createElement('th') : document.createElement('td');
            cellElement.textContent = cell;
            tr.appendChild(cellElement);
        });
        afternoonTable.appendChild(tr);
    }
    container.appendChild(afternoonTable);

    console.log(teacherSchedule);
}

// Load dữ liệu khi truy cập vào web
window.onload = async function () {
    await loadData();

    let lastTeacherName = localStorage.getItem('lastTeacherName');
    console.log(lastTeacherName);

    if (lastTeacherName) {
        document.getElementById('name-input').value = lastTeacherName;
        searchSchedule();
    }
};
// nhập tên giáo viên và chọn thì sẽ tìm kiếm thời khóa biểu
document.getElementById('name-input').addEventListener('change', searchSchedule);

// bấm vào cái search bar thì xóa tên giáo viên nhập từ trước
document.getElementById('name-input').addEventListener('focus', () => {
    document.getElementById('name-input').value = '';
    document.getElementById('schedule-container').innerHTML = '';
});

