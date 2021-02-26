// Holds the timer IDs in order to stop them when 'Stop' button pressed
const myHabitTimers = {};
const myHabitTimeRemaining = {};
let sleepTimerBool = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // To start timer for respective habit
  if (request.cmd === 'START_TIMER') {
    let remainingTime = request.timeValue * 60;
    let notificationPersist, notificationSoundCheckbox, loop;
    let currentSleepTimerBool = sleepTimerBool;

    chrome.storage.sync.get(['myHabits', 'notification-persist', 'notification-sound-checkbox'], result => {
      notificationPersist = result['notification-persist'];
      notificationSoundCheckbox = result['notification-sound-checkbox'];
      
      for(let i=0; i < result.myHabits.length; i++){
        if(result.myHabits[i].id === request.id){
          loop = result.myHabits[i].loop;
          break;
        }
      }
    })

    myHabitTimers[request.id] = setInterval(() => {   
      if(!sleepTimerBool){
        remainingTime--;
        if(sleepTimerBool !== currentSleepTimerBool) {
          remainingTime = request.timeValue * 60;
        }
      }
      currentSleepTimerBool = sleepTimerBool;
      remainingTimeInMinutes = secondsToMinutes(remainingTime);
      chrome.runtime.sendMessage({cmd: 'UPDATE_DISPLAY', 'remainingTime': remainingTimeInMinutes, 'id': request.id});
      myHabitTimeRemaining[request.id] = remainingTimeInMinutes;
    
      if(remainingTime === 0){
        //console.log("Time's up!");

        chrome.notifications.create(`${Date.now()}`, {
          title: request.habitName,
          message: "Reminder!",
          iconUrl: 'icons/icon128.png',
          type: 'basic',
          requireInteraction: notificationPersist
        });

        if(notificationSoundCheckbox){
          playSound();
        }

        if(loop){
          remainingTime = request.timeValue * 60;
        } else{
          clearInterval(myHabitTimers[request.id]);
          myHabitTimers[request.id] = "";
        }        
      }
    }, 1000)

  } else if (request.cmd === 'STOP_TIMER') { // To stop respective habit timer
    let myCountdown = myHabitTimers[request.id];
    clearInterval(myCountdown);
    myHabitTimers[request.id] = "";
  } else if (request.cmd === 'DELETE_HABIT') { // To Delete respective habit
    chrome.storage.sync.get([
      'myHabits'
    ], function(result){
      if(result.myHabits){
        for(let i=0; i < result.myHabits.length; i++){
          if(result.myHabits[i].id === request.id){
            let newMyHabits = [...result.myHabits];
            newMyHabits.splice(i, 1);
            chrome.storage.sync.set({'myHabits': newMyHabits}, () => {
              chrome.runtime.sendMessage({cmd: 'RESTORE_OPTIONS'});
            });
            break;
          }
        }
      }
    })
  } else if (request.cmd === 'GET_TIMER_STATUS') { // To check if timer is active
    let myCountdown = myHabitTimers[request.id];
    if(myCountdown === ""){
      sendResponse("");
    } else{
      sendResponse(myHabitTimeRemaining[request.id])
    }
    return true;
  }
});

// Check if current time falls within sleep timer
function createSleepTimer(sleepStart, sleepEnd) {
  checkSleepTimerStatus(sleepStart, sleepEnd);
  setInterval(() => {
    checkSleepTimerStatus(sleepStart, sleepEnd)
  }, 60000);
}

function checkSleepTimerStatus(sleepStart, sleepEnd) {
  let currentDate = new Date();
  let hour = currentDate.getHours();
  let minutes = currentDate.getMinutes();
  let currentTime = `${hour}:${minutes}`;
  if(hour < 10 && minutes < 10) {
    currentTime = `0${hour}:0${minutes}`;
  } else if(hour < 10) {
    currentTime = `0${hour}:${minutes}`;
  } else if(minutes < 10) {
    currentTime = `${hour}:0${minutes}`;
  } 
  if(sleepStart < sleepEnd) {
    if(currentTime >= sleepStart && currentTime < sleepEnd) {
      sleepTimerBool = true;
    } else {
      sleepTimerBool = false;
    }
  } else if(sleepStart > sleepEnd) {
    if(currentTime < sleepStart && currentTime > sleepEnd) {
      sleepTimerBool = false;
    }
    else if(currentTime < sleepStart && currentTime < sleepEnd) {
      sleepTimerBool = true;
    }
    else if(currentTime >= sleepStart && currentTime > sleepEnd) {
      sleepTimerBool = true;
    }
  }
}

// Play notification sound
function playSound() {
  chrome.storage.sync.get(['notification-sound'], function(result) {
    let soundName = result['notification-sound'];
    let sound = new Audio(`sounds/${soundName}.mp3`);
    sound.play();
  })
}

// Display seconds to minutes:seconds
function secondsToMinutes(seconds) {
  let minutes = Math.floor(seconds / 60);
  let remainder = seconds % 60;
  //console.log(`${minutes}:${remainder}`);

  if(remainder >= 10){
    return `${minutes}:${remainder}`
  } else{
    return `${minutes}:0${remainder}`
  }
}

// To reset all timers when settings change
document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.sync.get(['myHabits', 'sleep-timer-checkbox', 'sleep-timer-start', 'sleep-timer-end'], result => {
    if(result.myHabits){
      for(let i=0; i < result.myHabits.length; i++){
        let id = result.myHabits[i].id;
        myHabitTimers[id] = "";
      }
    }
    if(result['sleep-timer-checkbox']) {
      createSleepTimer(result['sleep-timer-start'], result['sleep-timer-end']);
    }
  })
})