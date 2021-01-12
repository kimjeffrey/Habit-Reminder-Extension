const myHabitTimers = {};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  //let time = document.querySelector(`.${request.habitName}`);

  if (request.cmd === 'START_TIMER') {
    let remainingTime = request.timeValue * 60;
    let notificationPersist, notificationSoundCheckbox, loop;

    chrome.storage.sync.get(['myHabits', 'notification-persist', 'notification-sound-checkbox'], result => {
      notificationPersist = result['notification-persist'];
      notificationSoundCheckbox = result['notification-sound-checkbox'];
      
      for(let i=0; i < result.myHabits.length; i++){
        if(result.myHabits[i].habitName === request.habitName){
          loop = result.myHabits[i].loop;
          break;
        }
      }
    })

    myHabitTimers[request.habitName] = setInterval(() => {   
      remainingTime--;
      remainingTimeInMinutes = secondsToMinutes(remainingTime);
      chrome.runtime.sendMessage({cmd: 'UPDATE_DISPLAY', 'remainingTime': remainingTimeInMinutes, 'habitName': request.habitClassName});
    
      if(remainingTime === 0){
        console.log("Time's up!");

        chrome.notifications.create(`${Date.now()}`, {
          title: request.habitName,
          message: "Reminder time!",
          iconUrl: 'icon.png',
          type: 'basic',
          requireInteraction: notificationPersist
        });

        if(notificationSoundCheckbox){
          playSound();
        }

        if(loop){
          remainingTime = request.timeValue * 60;
        } else{
          clearInterval(myHabitTimers[request.habitName]);
          myHabitTimers[request.habitName] = "";
        }        
      }
    }, 1000)

  } else if (request.cmd === 'STOP_TIMER') {
    let myCountdown = myHabitTimers[request.habitName];
    clearInterval(myCountdown);
    myHabitTimers[request.habitName] = "";
  } else if (request.cmd === 'DELETE_HABIT') {
    chrome.storage.sync.get([
      'myHabits'
    ], function(result){
      if(result.myHabits){
        for(let i=0; i < result.myHabits.length; i++){
          if(result.myHabits[i].habitName === request.habitName){
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
  } else if (request.cmd === 'GET_TIMER_STATUS') {
    let myCountdown = myHabitTimers[request.habitName];
    if(myCountdown === ""){
      sendResponse("");
    } else{
      sendResponse("active")
    }
    return true;
  }
});

function playSound() {
  chrome.storage.sync.get(['notification-sound'], function(result) {
    let soundName = result['notification-sound'];
    let sound = new Audio(`sounds/${soundName}.mp3`);
    sound.play();
  })
}

function secondsToMinutes(seconds) {
  let minutes = Math.floor(seconds / 60);
  let remainder = seconds % 60;
  console.log(`${minutes}:${remainder}`);

  if(remainder >= 10){
    return `${minutes}:${remainder}`
  } else{
    return `${minutes}:0${remainder}`
  }
}

document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.sync.get(['myHabits'], result => {
    if(result.myHabits){
      for(let i=0; i < result.myHabits.length; i++){
        let habitName = result.myHabits[i].habitName;
        myHabitTimers[habitName] = "";
      }
    }
  })
})