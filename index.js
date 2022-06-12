//global data
let data, current_user, isReplyBoxOpen, isEditBoxOpen;

// Loading Data
let commentsDiv = document.querySelector('.comments');
let createCommentsDiv = document.querySelector('.comment-input-area');
data = await fetch("./data.json");
let dataJSON = await data.text();
let dataObj = JSON.parse(dataJSON);
current_user = dataObj['currentUser']

// Show Comments
showComments(dataObj);
function showComments(data){
    let comments = data['comments']
    for(let comment of comments){
        let commentHTML = getComment(comment, current_user.username)
        commentsDiv.insertAdjacentHTML('beforeend', commentHTML)
    }
}

function getComment(comment={}, currentUser){
    let { user, createdAt, content, score, replyingTo = "", id } = comment;
    let ifThisIsCurrentUser = user.username == currentUser;
    let commentHTML = `
    <div 
    class='comment-box' 
    data-id='${id}'
    ${ifThisIsCurrentUser ? "currentuser" : ""}
    ${replyingTo ? "reply" : ""}>
        <div class="comment-header">
            <div class="user-info">
                <img src="${user.image.webp}" alt="user_avatar" class="user_avatar"/>
                <div class="userName bold-txt">${user.username}</div>
                <div class="comment-time">${typeof createdAt == 'string' ? createdAt: formatTime(createdAt)}</div>
            </div> 
            <div class="action-area">
            ${
            ifThisIsCurrentUser
                ? `<div class ="delete-btn bold-txt red-clr-txt low-opacity-hover" tabindex="0" data-action="delete">Delete</div>
                    <div class ="edit-btn bold-txt blue-clr-txt low-opacity-hover" tabindex="0" data-action="edit">Edit</div>`
                : `<div class="reply-btn bold-txt blue-clr-txt low-opacity-hover" tabindex="0" data-action="reply">Reply</div>`
            } 
            </div>
        </div>
        <div class="comment-text">
        ${replyingTo ? ` <span class="bold-txt blue-clr-txt">${"@" + replyingTo}</span>` : ""} 
        ${content}
        </div>
    </div>`;

    if (!comment.replies || !comment.replies.length) return commentHTML;

    //handling replies
    let repliesHTML = `
    <div class="replies-wrapper-comp">
        <div class="verticalLine"></div>
        <div class='replies-wrapper'>
        ${comment.replies.reduce(
            (previousReply, currentReply) =>  { return previousReply + getComment({...currentReply},currentUser)},
            "")
        }
        </div>
    </div>
   `;    


    return commentHTML + repliesHTML;
}


function getModifiedTime(time){
    // (note: timezone has been considered while rendering.)  
    time = new Date(time); 
    const splited_date = time.toString().split(" ");
    const year = splited_date[3];
    const date =  parseInt(splited_date[2]);
    const month = splited_date[1];
    const day = splited_date[0];
    let formatted_date  = date+" "+month+" "+year;
    return formatted_date;
}

function formatTime(past){

    let modifiedTime = "0 min ago";
    let current = Date.now();
    
    let diffInMilliSec = current - past;
    let diffInSec = Math.floor(diffInMilliSec/1000);
    let diffInMin = Math.floor(diffInSec/60);
    let diffInHours = Math.floor(diffInMin/60);
    let diffInDays = Math.floor(diffInHours/24);
    
    if(diffInDays >= 2){
        modifiedTime = formatTime(past);
    }
    else if(diffInDays==1){
        modifiedTime = "1 day ago";
    }
    else if(diffInHours>=1){
        modifiedTime = diffInHours + " hrs ago";
        if(diffInHours==1){
            modifiedTime = diffInHours + " hr ago";
        }
    }
    else if(diffInMin>=1){
        modifiedTime = diffInMin + " mins ago";
        if(diffInMin==1){
            modifiedTime = diffInMin + " min ago";
        }
    }
    else{
       modifiedTime = "0 min ago";
    }
    return modifiedTime;

}


//create new comment
createCommentsDiv.addEventListener('submit',(e)=>{
    e.preventDefault();
    let commentTextArea = createCommentsDiv.querySelector('textarea');
    let timeOfComment = Date.now();
    let commentData = {
      user: current_user,
      createdAt: timeOfComment,
      content: commentTextArea.value,
      score: 0,
      replies : [],
      id: 3
    };
    commentsDiv.insertAdjacentHTML('beforeend',getComment(commentData, current_user.username));
    commentTextArea.value = "";
  });

//add a reply or edit/delete comment

document.addEventListener("click", (e)=>{
    let target = e.target;
    let parent = target.closest(".comment-box");
    if (!target.dataset.action && !parent) return;
    let action = target.dataset.action;

    // replies
    if(action == 'reply'){
        if (isReplyBoxOpen) {
        document.querySelector('.reply-input-area').remove();
        isReplyBoxOpen = false;
        return;
        }
    let replyHTML = getReplyHTML();
    parent.insertAdjacentHTML('afterend',replyHTML);
    isReplyBoxOpen = true;
    //get textarea value, form a comment, push reply on submit
    
    document.querySelector('.reply-input-area').addEventListener('submit',(e)=>{
        e.preventDefault();     
        const current_target = e.currentTarget; //note
        const replyText = current_target.querySelector('textarea').value;
        let replyingTo = parent.querySelector('.userName').textContent; //note
        let timeOfComment = Date.now();
      
        let commentData = {
            user: current_user,
            createdAt: timeOfComment,
            content: replyText,
            score: 0,
            replyingTo : replyingTo,
            id: 3
        };
    
        let replyBoxHTML = getComment(commentData,current_user.username);
        let repliesHTML = `
        <div class="replies-wrapper-comp">
            <div class="verticalLine"></div>
            <div class='replies-wrapper'>${replyBoxHTML}</div>
        </div>
        `;

         isReplyBoxOpen = false;
         
         let alreadyOtherReplies = current_target.nextElementSibling?.classList.contains(".replies-wrapper"),
          replyingtoreply = current_target.closest(".replies-wrapper");

        if (alreadyOtherReplies || replyingtoreply) {
          if (alreadyOtherReplies) {
            current_target.nextElementSibling.insertAdjacentHTML("beforeend", replyBoxHTML);
          } else if (replyingtoreply) {
            current_target.closest(".replies-wrapper").insertAdjacentHTML("beforeend", replyBoxHTML);
          }
          current_target.remove();
          return;
        }
        current_target.outerHTML = repliesHTML;
         

    });

    

    } 
});

function getReplyHTML(){
    return `<form class="comment-input-area reply-input-area ">
        <img src="images/avatars/image-juliusomo.png"
        alt="user_avatar"
        class="user_avatar" />
        <textarea placeholder="Reply..."></textarea>
        <input type="submit" value="REPLY" 
        class="submit-btn low-opacity-hover bold-txt" />
    </form>`;
}
