// TASK: import helper functions from utils
import { deleteTask, getTasks } from  "./utils/taskFunctions.js";
import { saveTasks } from "./utils/taskFunctions.js";
import {createNewTask} from "./utils/taskFunctions.js";
import {patchTask} from   "./utils/taskFunctions.js";
import {putTask} from     "./utils/taskFunctions.js";
// TASK: import initialData
import { initialData } from "./initialData.js";


// Function checks if local storage already has data, if not it loads initialData to localStorage
function initializeData() {
  if (!localStorage.getItem('tasks')) {
    localStorage.setItem('tasks', JSON.stringify(initialData)); 
    localStorage.setItem('showSideBar', 'true')
  } else {
    console.log('Data already exists in localStorage');
  }
}

// Get elements from the DOM
const elements = {
  headerBoardName : document.getElementById("header-board-name"),
  columnDivs : document.querySelectorAll(".column-div"),
  filterDiv : document.getElementById("filterDiv"),
  hideSideBarBtn : document.getElementById("hide-side-bar-btn"),
  showSideBarBtn: document.getElementById("show-side-bar-btn"),
  themeSwitch : document.getElementById("switch"),
  createNewTaskBtn : document.getElementById("add-new-task-btn"),
  modalWindow : document.getElementById("new-task-modal-window"),
  editTaskModal : document.querySelector(".edit-task-modal-window"),
  taskContainerEl : document.querySelector("tasks-container"),
  logo : document.getElementById("logo")
}

let activeBoard = "";

function fetchAndDisplayBoardsAndTasks(){
  const tasks =  getTasks();
  const boards = [...new Set(tasks.map(task => task.board).filter(Boolean))];

  console.log(boards);
  displayBoards(boards)

  if(boards.length > 0){
    const localStorageBoard = JSON.parse(localStorage.getItem("activeBoard"))
    activeBoard = localStorageBoard ? localStorageBoard :  boards[0]; 
    elements.headerBoardName.textContent = activeBoard
    styleActiveBoard(activeBoard);
    refreshTasksUI();
  }
}

function displayBoards(boards) {
  const boardsContainer = document.getElementById("boards-nav-links-div");
  boardsContainer.innerHTML = ''; // Clears the container
  boards.forEach(board => {
    const boardElement = document.createElement("button");
    boardElement.textContent = board;
    boardElement.classList.add("board-btn");
    boardElement.addEventListener("click" , () =>  { 
      elements.headerBoardName.textContent = board;
      filterAndDisplayTasksByBoard(board);
      activeBoard = board //assigns active board
      localStorage.setItem("activeBoard", JSON.stringify(activeBoard))
      styleActiveBoard(activeBoard)
    });
    boardsContainer.appendChild(boardElement);
  });

}

function filterAndDisplayTasksByBoard(boardName) {
  const tasks = getTasks(); // Fetch tasks from a simulated local storage function
  const filteredTasks = tasks.filter(task => task.board == boardName);

  console.log(filteredTasks);

   // Ensure the column titles are set outside of this function or correctly initialized before this function runs

   elements.columnDivs.forEach(column => {
    const status = column.getAttribute("data-status");
    // Reset column content while preserving the column title
    column.innerHTML = `<div class="column-head-div">
                          <span class="dot" id="${status}-dot"></span>
                          <h4 class="columnHeader">${status.toUpperCase()}</h4>
                        </div>`;

    const tasksContainer = document.createElement("div");
    column.appendChild(tasksContainer);

    filteredTasks.filter(task => task.status == status).forEach(task => { 
      const taskElement = document.createElement("div");
      taskElement.classList.add("task-div");
      taskElement.textContent = task.title;
      taskElement.setAttribute('data-task-id', task.id);

      // Listen for a click event on each task and open a modal
      taskElement.addEventListener("click" , () => { 
        openEditTaskModal(task);
      });

      tasksContainer.appendChild(taskElement);
    });
  });
}

function refreshTasksUI(){
  filterAndDisplayTasksByBoard(activeBoard);
}

function styleActiveBoard(boardName){
  document.querySelectorAll('.board-btn').forEach(btn => { 
    
    if(btn.textContent === boardName) {
      btn.classList.add('active') 
    }
    else {
      btn.classList.remove('active'); 
    }
  });
}

function addTaskToUI(task) {
  const column = document.querySelector('.column-div[data-status="${task.status}"]'); 
  if (!column) {
    console.error(`Column not found for status: ${task.status}`);
    return;
  }else{
    console.log("column found");
  }

  let tasksContainer = column.querySelector('.tasks-container');

  if (!tasksContainer) {
    console.warn(`Tasks container not found for status: ${task.status}, creating one.`);
    tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks-container';
    column.appendChild(tasksContainer);
  }

  const taskElement = document.createElement('div');
  taskElement.className = 'task-div';
  taskElement.textContent = task.title; // Modify as needed
  taskElement.setAttribute('data-task-id', task.id);
  
  tasksContainer.appendChild(taskElement); 
 
}

function setupEventListeners() {
  // Cancel editing task event listener
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  cancelEditBtn.addEventListener("click" , () => toggleModal(false, elements.editTaskModal));

  // Cancel adding new task event listener
  const cancelAddTaskBtn = document.getElementById('cancel-add-task-btn');
  cancelAddTaskBtn.addEventListener('click', () => {
    toggleModal(false);
    elements.filterDiv.style.display = 'none'; // Also hide the filter overlay
  });

  // Clicking outside the modal to close it
  elements.filterDiv.addEventListener('click', () => {
    toggleModal(false);
    elements.filterDiv.style.display = 'none'; // Also hide the filter overlay
  });

  // Show sidebar event listener
  elements.hideSideBarBtn.addEventListener("click" , () => toggleSidebar(false));
  elements.showSideBarBtn.addEventListener("click" , () => toggleSidebar(true));

  // Theme switch event listener
  elements.themeSwitch.addEventListener('change', toggleTheme);

  // Show Add New Task Modal event listener
  elements.createNewTaskBtn.addEventListener('click', () => {
    toggleModal(true);
    elements.filterDiv.style.display = 'block'; // Also show the filter overlay
  });

  // Add new task form submission event listener
  elements.modalWindow.addEventListener('submit',  (event) => {
    addTask(event);
  });
}

function toggleModal(show, modal = elements.modalWindow) {
  modal.style.display = show ? 'block' : 'none'; 
}

function addTask(event) {
  event.preventDefault(); 

  //Assign user input to the task object
    const task = {
      id : Date.now(),
      title : elements.modalWindow.querySelector("#title-input").value,
      description: elements.modalWindow.querySelector("#desc-input").value,
      status: elements.modalWindow.querySelector("#select-status").value,
      board : activeBoard
    };

    console.log(task);
    
    const newTask = createNewTask(task);
    if (newTask) {
      addTaskToUI(newTask);
      toggleModal(false);
      elements.filterDiv.style.display = 'none'; // Also hide the filter overlay
      event.target.reset();
      refreshTasksUI();
    }
}

function toggleSidebar(show){

  const sideBarEl = document.querySelector(".side-bar");
  
  switch(show){
  case true:
    sideBarEl.style.display = "block";
    elements.showSideBarBtn.style.display = "none"; 

  break;
  case false:
    sideBarEl.style.display = "none";
    elements.showSideBarBtn.style.display = "block"; 
  break;
}
}

function toggleTheme() {

  const isLightTheme = document.body.classList.toggle('light-theme');

  localStorage.setItem("light-theme", isLightTheme ? "enabled" : "disabled");
  elements.logo.src = isLightTheme ? "./assets/logo-light.svg" : "./assets/logo-dark.svg";

}

function openEditTaskModal(task) {
  // Set task details in modal inputs
  const taskDetails = {
    title : task.title,
    description : task.description,
    status : task.status
  }

const title = elements.editTaskModal.querySelector("#edit-task-title-input");
const description = elements.editTaskModal.querySelector("#edit-task-desc-input");
const status = elements.editTaskModal.querySelector("#edit-select-status");

title.value = taskDetails.title
description.value = taskDetails.description
status.value = taskDetails.status

elements.editTaskModal.style.display = "block";

  // Get button elements from the task modal
const saveEditBtn = document.getElementById("save-task-changes-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const deleteEditBtn = document.getElementById("delete-task-btn");

  // Call saveTaskChanges upon click of Save Changes button
  saveEditBtn.addEventListener("click" , () => {
    saveTaskChanges(task.id);
    toggleModal(false, elements.editTaskModal);
  });
 

  // Delete task using a helper function and close the task modal
  deleteEditBtn.addEventListener("click", () => {
    deleteTask(task.id);
    toggleModal(false, elements.editTaskModal);
    refreshTasksUI();
  });


  toggleModal(true, elements.editTaskModal); // Show the edit task modal
}

function saveTaskChanges(taskId) {
  // Get new user inputs
  const titleEl = elements.editTaskModal.querySelector("#edit-task-title-input");
const descriptionEl = elements.editTaskModal.querySelector("#edit-task-desc-input");
const statusEl = elements.editTaskModal.querySelector("#edit-select-status");

  // Create an object with the updated task details
  const updatedTaskDetails = {
    title : titleEl.value,
    description : descriptionEl.value,
    status : statusEl.value
  }


  // Update task using a hlper functoin
  const details = patchTask(taskId,updatedTaskDetails);
;
 
  // Close the modal and refresh the UI to reflect the changes

  refreshTasksUI();
}

document.addEventListener('DOMContentLoaded', function() {
  init(); // init is called after the DOM is fully loaded
});

function init() {
  initializeData();
  setupEventListeners();
  const showSidebar = localStorage.getItem('showSideBar') === 'true';
  toggleSidebar(showSidebar);
  const isLightTheme = localStorage.getItem('light-theme') === 'enabled';
  document.body.classList.toggle('light-theme', isLightTheme);
  fetchAndDisplayBoardsAndTasks();

// Initial display of boards and tasks
}