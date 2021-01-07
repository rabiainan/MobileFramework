var serviceURL = localStorage.getItem("serviceURL");
var session = localStorage.getItem("session_ID");
var commentCount = 0;
var ticketArr = [];
var c = 0;

$('.sk-fading-circle')
    .show();

function getAllTickets() {
    var width = $(window)
        .width();
    var sideBar = (width / 100) * 70;
    $(window)
        .resize(function () {
            var width = $(window)
                .width();
            var sideBar = (width / 100) * 70;
            $('.side-menu')
                .css({
                    'display': 'block'
                    , 'left': '-' + sideBar + 'px'
                });
        });

    $('.side-menu')
        .css({
            'display': 'block'
            , 'left': '-' + sideBar + 'px'
        });

    var message = localStorage.getItem('message');
    if (message !== null /* || message !== undefined*/ ) {
        toastr.options = {
            "closeButton": true
            , "debug": false
            , "newestOnTop": false
            , "progressBar": true
            , "positionClass": "toast-top-center"
            , "preventDuplicates": true
            , "onclick": null
            , "showDuration": "300"
            , "hideDuration": "1000"
            , "timeOut": "5000"
            , "extendedTimeOut": "1000"
            , "showEasing": "swing"
            , "hideEasing": "linear"
            , "showMethod": "fadeIn"
            , "hideMethod": "fadeOut"
        };

        toastr.success(message, 'Comment Added');
        var cx = ($(window)
            .width() - 300) / 2;
        $('.toast-top-center')
            .css({
                'left': cx + 'px'
            });
        localStorage.removeItem('message');
    }

    var sessionData = {
        "sessionId": session
    };

    $.ajax({
        url: serviceURL + "Json/MicroApps/getMicroApps"
        , type: "GET"
        , data: {
            'data': JSON.stringify(sessionData)
        }
        , dataType: "jsonp"
        , //contentType: "text/plain",
        //jsonp : false,
        //jsonpCallback: 'jsonCallback',
        success: function (data) {
            jQuery.each(data['microApps'], function (i, val) {
                $('#applicationId')
                    .append(
                        $('<option></option>')
                        .val(val['id'])
                        .html(val['name']));
            });
        }
        , error: function (jqXmlHttpRequest, textStatus, errorThrown) {
		navigator.notification.alert(
                           'For security reasons, you\'ve been logged out. Please log back in to continue.',
                           logout, 'Please log in again',
                     'Dismiss');
            /*toastr.options = {
                "closeButton": true
                , "debug": false
                , "newestOnTop": false
                , "progressBar": true
                , "positionClass": "toast-top-center"
                , "preventDuplicates": true
                , "onclick": null
                , "showDuration": "300"
                , "hideDuration": "1000"
                , "timeOut": "10000"
                , "extendedTimeOut": "1000"
                , "showEasing": "swing"
                , "hideEasing": "linear"
                , "showMethod": "fadeIn"
                , "hideMethod": "fadeOut"
            };

            toastr.warning('There is something wrong. Please try loading the page again or connecting to the internet to submit and read tickets', 'Something has went wrong');
            var cx = ($(window)
                .width() - 300) / 2;
            $('.toast-top-center')
                .css({
                    'left': cx + 'px'
                });*/
        }
    });

    var ticketData = {
        "sessionId": session
    };

    var params = '?callback=showTickets&data=' + encodeURIComponent($.toJSON(ticketData));

    var newScript = document.createElement('script');
    newScript.setAttribute('src', (serviceURL + "Json/Support/getTickets") + params);
    document.head.appendChild(newScript);

}

function showTickets(data) {
    var ticketData;
    var params;

    /*if(data['tickets'] !== undefined)
     {*/

    if (data['tickets'].length > 0) {
        localStorage.setItem("tickets", JSON.stringify(data['tickets'].reverse()));
        localStorage.setItem("ticketTotal", JSON.stringify(data['tickets'].length));
        var serviceURL = localStorage.getItem("serviceURL");
        $('.ticket_title_show')
            .html('Open Tickets');
        var db = ContainerDatabaseManager.getContainerDb();
        db.transaction(queryTicketDB, errorCB);

        jQuery.each(data['tickets'], function (i, val) {

            ticketData = {
                "sessionId": session
                , "ticketId": val['id']
            };

            params = '?callback=countTotalTicketComments&data=' + encodeURIComponent($.toJSON(ticketData));
            var newScript = document.createElement('script');
            newScript.setAttribute('src', (serviceURL + "Json/Support/getTicketComments") + params);
            document.head.appendChild(newScript);
            getFirstComment(val['id']);
        });

    } else {
        $('#firstPageTickets')
            .html('<h4 style="text-align: center;">You haven\'t created any support tickets yet. Use the button in the top left corner to create your first ticket.</h4>');
        $('.unread_tickets')
            .hide();
    }
    /*}
     else
     {
    	var serviceURL = localStorage.getItem("serviceURL");
    	var username = localStorage.getItem("username");
    	var pass = localStorage.getItem("pass");
    	authenticateUser(serviceURL, username, pass, 'settings.html');
     }*/


    /*console.log($(".ticketInfo").data('ticketid'));
     console.log(data['tickets']);*/
}

function queryTicketDB(tx) {
    /*tx.executeSql('DROP TABLE tickets');
    tx.executeSql('DROP TABLE ticketComments');
    tx.executeSql('DROP TABLE commentCount');
    localStorage.removeItem('commentCount');
    localStorage.removeItem("tickets");*/

    var session = localStorage.getItem("session_ID");
    var username = localStorage.getItem("username");
    var pass = localStorage.getItem("pass");
    var tickets = JSON.parse(localStorage.getItem("tickets"));

    tx.executeSql('CREATE TABLE IF NOT EXISTS tickets (id INTEGER PRIMARY KEY, username VARCHAR(255), ticketId INT(11), issuer VARCHAR(255), issuerId INT(11), microAppId INT(11), microAppName VARCHAR(255), status VARCHAR(25), title TEXT, created VARCHAR(255))');

    /*tx.executeSql('UPDATE tickets set status = "closed"', [], function(tx, result) {
     //console.log(result);
     });*/

    var ticketIds = new Array();
    for (var i in tickets) {
        var tick = tickets[i]['id'];
        ticketIds.push(tick);
    }

    console.log(tickets.length);

    for (i = 0; i < tickets.length; i++) {
        var ticket = tickets[i];

        tx.executeSql('SELECT * FROM tickets WHERE ticketId = ?', [ticket['id']], function (tx, result) {
            console.log(result.rows.length);
            if (result.rows.length == 0) {
                tx.executeSql('INSERT INTO tickets (username, ticketId, issuer, issuerId, microAppId, microAppName, status, title, created) VALUES ("' + username + '", "' + ticket['id'] + '", "' + ticket['issuer'] + '", "' + ticket['issuerId'] + '", "' + ticket['microAppId'] + '", "' + ticket['microAppName'] + '", "' + ticket['status'] + '", "' + ticket['title'] + '", "' + ticket['created'] + '")');
            }
            /*else
             {
             tx.executeSql('UPDATE tickets set status = "open" WHERE ticketId IN (' + ticketIds +')', [], function(tx, result) {
             console.log(result);
             });
             }*/
        });
    }

    tx.executeSql('SELECT * FROM tickets WHERE username = ?', [username], function (tx, result) {
        //console.log(result);
    });
}

function countTotalTicketComments(data) {
    //console.log(data);
    //localStorage.setItem('commentCount', commentCount);
}

function raiseNewTicket() {
    var appId = $('#applicationId')
        .val();
    var title = $.trim($('#ticketTitle')
        .val());
    var comments = $.trim($('#ticketComments')
        .val());

    var error = false;
    var errorMessage = 'The following fields are missing:';
    if (appId == null || appId == '') {
        error = true;
        errorMessage += '<br><b>Application</b>';
    }

    if (title == null || title == '') {
        error = true;
        errorMessage += '<br><b>Title</b>';
    }

    if (comments == null || comments == '') {
        error = true;
        errorMessage += '<br><b>Ticket Description</b>';
    }

    if (error == true) {
        toastr.options = {
            "closeButton": true
            , "debug": false
            , "newestOnTop": true
            , "progressBar": true
            , "positionClass": "toast-top-center"
            , "preventDuplicates": true
            , "onclick": null
            , "showDuration": "300"
            , "hideDuration": "1000"
            , "timeOut": "10000"
            , "extendedTimeOut": "1000"
            , "showEasing": "swing"
            , "hideEasing": "linear"
            , "showMethod": "fadeIn"
            , "hideMethod": "fadeOut"
        };

        toastr.warning(errorMessage, 'Cannot submit Ticket');
        var cx = ($(window)
            .width() - 300) / 2;
        $('.toast-top-center')
            .css({
                'left': cx + 'px'
            });
    } else {
        var ticketData = {
            "sessionId": session
            , "microAppId": appId
            , "title": title
            , "comment": comments
        };

        var params = '?callback=ticketRaised&data=' + encodeURIComponent($.toJSON(ticketData));

        var newScript = document.createElement('script');
        newScript.setAttribute('src', (serviceURL + "Json/Support/raiseTicket") + params);
        document.head.appendChild(newScript);
        //newTicket();
    }
}

function ticketRaised(data) {
    localStorage.setItem('message', 'Ticket ' + data.ticketId + ' Raised Successfully');
    //remove ticketId from localStorage
    location.href = 'settings.html';
    /*$('#information').text().fadeOut(2500,"linear");
     $('#applicationId').val('');
     $('#ticketTitle').val('');
     $('#ticketComments').val('');*/
    //getAllTickets();
}

function commentRaised(data) {
    console.log(data);
}


function getComments(obj, e) {
    //console.log(e['srcElement']['id']);
    if (e['srcElement']['id'] == "additionalComment" || e['srcElement']['id'] == "ticketResolved" || e['srcElement']['id'] == "postReply" || e['srcElement']['id'] == "labelTicketResolved") {
        return false;
    } else {
        $('.raiseTicket')
            .hide();
        var ticketId = obj.getAttribute('data-ticketid');
        var appId = obj.getAttribute('data-microappid');
        var trClass = obj.className;
        localStorage.setItem('trClass', trClass);
        $('.origHeader_' + ticketId)
            .show();
        $('.hide-me')
            .hide();
        $('.ticket')
            .hide();
        $('.ticketInfo_' + ticketId)
            .show();
        var ticketData = {
            "sessionId": session
            , "ticketId": ticketId
        };

        localStorage.setItem('ticketId', ticketId);

        var params = '?callback=showTicketComments&data=' + encodeURIComponent($.toJSON(ticketData));

        var newScript = document.createElement('script');
        newScript.setAttribute('src', (serviceURL + "Json/Support/getTicketComments") + params);
        document.head.appendChild(newScript);
    }
}

function queryReadComments(tx) {
    var ticketId = localStorage.getItem('ticketId');
    var commentCount = localStorage.getItem('commentCount');

    tx.executeSql('SELECT * FROM ticketComments WHERE ticketId = ?', [ticketId], function (tx, result) {
        var length = result.rows.length;
        if (result.rows.length > 0) {
            var c = 0;
            for (r = 0; r < result.rows.length; r++) {
                if (result.rows.item(r)['read'] == 0) {
                    $('tr.comment_id_' + result.rows.item(r)['ticketCommentId'])
                        .addClass('unread');
                    $('.show_unread_' + result.rows.item(r)['ticketId'])
                        .show();
                    c++;
                } else {
                    //console.log('tr.comment_id_'+result.rows[r]['ticketCommentId'])
                    $('.show_unread_' + result.rows.item(r)['ticketId'])
                        .hide();
                    $('.comment_id_' + result.rows.item(r)['ticketCommentId'])
                        .removeClass('unread');
                }

            }

            tx.executeSql('UPDATE ticketComments SET read = 1 WHERE ticketId = ?', [ticketId], function (tx, result) {
                //console.log(result);
            });

            var newCount = commentCount - c;
            console.log('newcommentCount: ' + newCount);
            localStorage.setItem('commentCount', newCount);

            var db = ContainerDatabaseManager.getContainerDb();
            db.transaction(updateCommentCount, errorCB);

        }
    });
}

function getFirstComment(ticket) {
    var ticketData = {
        "sessionId": session
        , "ticketId": ticket
    };

    var params = '?callback=showFirstTicketComments&data=' + encodeURIComponent($.toJSON(ticketData));

    var newScript = document.createElement('script');
    newScript.setAttribute('src', (serviceURL + "Json/Support/getTicketComments") + params);
    document.head.appendChild(newScript);
}

function getAppIcon(appId) {

    var session = localStorage.getItem("session_ID");

    var folderData = {
        "sessionId": session
    };

    var serviceURL = localStorage.getItem("serviceURL");
    var micAppData = JSON.parse(localStorage.getItem("microAppData"));
    var folderImgData = JSON.parse(localStorage.getItem("folderImages"));
    var src;

    if (localStorage.getItem("microAppData") !== null && localStorage.getItem("folderImages") !== null && refreshData == false) {
        //alert('local storage images');

        var thumbnailId;
        jQuery.each(micAppData['microApps'], function (i, val) {
            //console.log(val);
            if (appId == val['id']) {
                thumbnailId = val['thumbnailId'];
            }

            //$(".thumbnail_"+val['id']+" .app_container .app_bg_icon").css("background", "url("+val['src']+") 50%");
        });

        jQuery.each(folderImgData['images'], function (i, val) {
            if (thumbnailId == val['id']) {
                src = val['src'];
            }
        });

    }
    if (src == null || src == '') {
        src = "../www/css/img/app_folder_microapp.png";
    }
    return src;
}

function showTicketComments(data) {
    //console.log(data);
    var trClass = localStorage.getItem('trClass');
    //console.log(trClass);
    $('.raiseTicket')
        .hide();
    //hide all other comments onclick
    $('tr.comments')
        .remove();
    //add blank row to seperate other tickets for now
    $('#theTable')
        .append('<tr class="comments"><td colspan="4" style="background-color: #eef0f1;border: none;">Replies <span style="color:#979ba1;">(' + (data['ticketComments'].length - 1) + ')</span></td></tr>');

    //list all of the comments for the selected tickets
    jQuery.each(data['ticketComments'], function (i, val) {
        var issuer = 'You';
        var style = "style='border-left: 15px solid #eef0f1'";
        var padding_style = "style='padding-left: 15px;border-bottom: 1px solid #eef0f1;border-top: 0px;'";
        if (val['issuer'] != '') {
            var issuer = val['issuer'];
            style = '';
            padding_style = '';
        }


        if (i > 0) {
            $('#theTable')
                .append('<tr ' + style + ' class="comments comment_id_' + val['id'] + '">' +
                    '<td colspan="4" ' + padding_style + '>' +
                    '<span style="font-size: 10px; color:#8b969e;">' + issuer + ' ' + moment(val['created'], "DD-MM-YYYY hh:mm")
                    .fromNow() + '</span>' +
                    '<p class="ticket_comment">' + val['comment'] + '</p>' +
                    '</td>' +
                    '</tr>');

            if (issuer = 'You') {
                $('tr.comments')
                    .css('border-left: 5px solid #ddd');
            }
        }
    });

    //next add an additional comment text box above the blank row
    $('#theTable')
        .append('<tr class="comments" style="border-left: 15px solid #eef0f1;">' +
            '<td colspan="4" style="padding:0;">' +
            '<p id="postReply" style="color: #979ba1;font-size: 12px;padding: 10px 10px 3px 15px;margin:0;">Post a reply</p>' +
            '</td>' +
            '</tr>' +
            '<tr class="comments" style="border-left: 15px solid #eef0f1;">' +
            '<td colspan="4" style="border:none;">' +
            '<textarea rows="3" class="excludeMe input-block-level create_ticket_field" id="additionalComment" placeholder="Submit additional comment" style="margin: 0px;width: 100%; border: 2px solid #8b969e;resize: none;"/>' +
            '</td>' +
            '</tr>' +
            '<tr class="comments" style="border-left: 15px solid #eef0f1;border-bottom: 2px solid #eef0f1;">' +
            '<td colspan="4" style="border:none;">' +
            '<button type="button" class="button btn excludeMe" style="float:right;background: #248bc7;color: white;margin: 0px;" onclick="addAdditionalComment(' + data['ticketComments'][0]['ticketId'] + ');">Add comment</button>' +
            '</td>' +
            '</tr>');

    //ticket information
    var db = ContainerDatabaseManager.getContainerDb();
    db.transaction(queryReadComments, errorCB);
    swapNavbar(true, data);

}

function swapNavbar(val, data) {
    var db = ContainerDatabaseManager.getContainerDb();
    db.transaction(updateCommentCount, errorCB);

    $('.navbar-header')
        .html('');

    if (val == true) {
        var rtClass = "'.hide-me, .ticket'";
        var remclass = "'tr.comments, .remove-me'";
        var hideme = "'.origHeader_" + data['ticketComments'][0]['ticketId'] + "'";
        $('.navbar-header')
            .append('<table style="width: 100%">' +
                '<tbody>' +
                '<tr>' +
                '<td class="header-icon remove-me" onclick="$(' + rtClass + ').show();$(' + remclass + ').remove();$(' + hideme + ').hide();swapNavbar(false, null);">' +
                '<img class="small side-menu-button" src="img/back_to_apps.png" data-toggle="collapse" style="float:left;margin: 0px !important;height: 35px;">' +
                '</td>' +
                '<td>' +
                '<p id="title_header" class="remove-me">Ticket #' + data['ticketComments'][0]['ticketId'] + ' </p>' +
                '</td>' +
                '<td class="header-icon" onclick="NavBar.toggle(false)">' +
                '<img class="small side-menu-button" src="img/side-menu2.png" style="cursor: pointer">' +
                '</td>' +
                '</tr>' +
                '</tbody>' +
                '</table>');
    } else {
        var db = ContainerDatabaseManager.getContainerDb();
        db.transaction(markAsRead, errorCB);
        $('.navbar-header')
            .append('<table style="width: 100%">' +
                '<tbody>' +
                '<tr>' +
                '<td class="header-icon" onclick="newTicket();">' +
                '<img id="newTickImg" class="small side-menu-button" src="img/newTicket.png" data-toggle="collapse" style="float:left;margin: 0px !important;height: 35px;">' +
                '</td>' +
                '<td>' +
                '<p id="title_header">Support</p>' +
                '</td>' +
                '<td class="header-icon">' +
                '<img class="small side-menu-button" src="img/side-menu2.png" style="cursor: pointer" onclick="NavBar.toggle(false)"/>' +
                '</td>' +
                '</tr>' +
                '</tbody>' +
                '</table>');
    }
}

function updateCommentCount(tx) {
    var username = localStorage.getItem('username');
    var commentCount = localStorage.getItem('commentCount');
    if (commentCount < 0)
        commentCount = 0;

    tx.executeSql('INSERT INTO commentCount (username, count) VALUES ("' + username + '", "' + commentCount + '")');

    if (commentCount > 0) {
        $('.sk-fading-circle')
            .hide();
        $('.unread_tickets')
            .html(commentCount);
    } else {
        $('.sk-fading-circle')
            .hide();
        $('.unread_tickets')
            .hide()
            .html('');
    }

}

function newTicket() {
    if ($('#newTickImg')
        .attr('src') == 'img/newTicket.png') {
        $('#newTickImg')
            .attr('src', 'img/cancel.png');
        $('#show_open_tickets')
            .hide();

    } else {
        $('#newTickImg')
            .attr('src', 'img/newTicket.png');
        $('#show_open_tickets')
            .show();
    }
    $('.raiseTicket')
        .toggle();
    $('.tickets')
        .toggle();
}
var fc = [];

function showFirstTicketComments(data) {
    var tickets = JSON.parse(localStorage.getItem("tickets"));
    //localStorage.setItem('ticketComments', JSON.stringify(data['ticketComments']));
    for (var i in data['ticketComments']) {
        var ticketComment = data['ticketComments'][i];
        ticketArr.push(ticketComment);
    }

    var first_comment = data['ticketComments'][0];
    var ticketID = data['ticketComments'][0]['ticketId'];
    var trClass = localStorage.getItem('trClass');

    $('.tickets')
        .html('');
    $('.tickets')
        .append('<div style="overflow-x:hidden !important;font-size:13px;">' +
            '<table id="theTable" class="table"><tbody>');

    fc.push(first_comment);

    jQuery.each(tickets, function (i, val) {

        $('#theTable')
            .append(
                '<tr class="origHeader_' + val['id'] + '" style="display:none;">' +
                '<td colspan="4" style="background: #eef0f1;border: none;font-size: 17px;padding-bottom: 12px;padding-top: 12px;">' +
                'Original Message' +
                '</td>' +
                '</tr>' +
                '<tr class="origHeader_' + val['id'] + '" style="border-bottom: 2px solid #eef0f1; display:none;">' +
                '<td colspan="3" style="border:none;">' +
                '<img width="35" src="' + getAppIcon(val['microAppId']) + '"/>' +
                '<span style="margin: 5px;vertical-align: middle;color: #525b61;">' + val['microAppName'] + '</span>' +
                '</td>' +
                '<td style="text-align:right;vertical-align:middle;border:none;" data-appname="' + val['microAppName'] + '" id="microapp_' + val['microAppId'] + '" onclick="getMicroAppData(this)"">' +
                '<img width="20" src="img/launchApp.png"/>' +
                '</td>' +
                '</tr>');

        //theTable.attr("data-thumbnailid", val['thumbnailid']);

        $('#theTable')
            .append(
                '<tr colspan="4" class="ticket ticket_unread_' + val['id'] + ' ticketInfo_' + val['id'] + '" onclick="getComments(this, event);return false;" data-microappid="' + val['microAppId'] + '" data-ticketid="' + val['id'] + '" data-thumbnailid="">' +
                '<td colspan="4" style="border:none;color: #525b61;" id="titleHeader"><span class="ticket_title_span">' + val['title'] + '</span><span style="font-size: 10px; color:#8b969e;"> posted by you ' + moment(val['created'], "DD-MM-YYYY hh:mm")
                .fromNow() + '</span></td>' +
                '</tr>' +
                '<tr colspan="4" class="ticket ticket_unread_'+val['id']+' ticketInfo_'+val['id']+'" onclick="getComments(this, event);return false;" data-microappid="'+val['microAppId']+'" data-ticketid="'+val['id']+'" data-thumbnailid="">' +
                '<td colspan="4" class="first_comment_style" id="first_comment_' + val['id'] + '" style="font-weight:300;border:none;color:#6b7980;padding-bottom:10px;padding-top: 0px"></td>' +
                '</tr><tr colspan="4" style="border-top: none;border-bottom:2px solid #eef0f1; "><td class="hide-me" colspan="4" style="border:none;padding:0px"></td></tr>');
    });

    $('.tickets')
        .append('</tbody></table></div>');
    jQuery.each(fc, function (i, value) {
        $('#first_comment_' + value['ticketId'])
            .html(value['comment']);
    });


    $('#theTable')
        .hide();
    $('#firstPageTickets')
        .show();

    $('#show_open_tickets')
        .click(function () {
            $('#theTable')
                .show();
            $('#firstPageTickets')
                .hide();
        });

    var db = ContainerDatabaseManager.getContainerDb();
    db.transaction(queryTicketCommentsDB, errorCB);
}

function queryTicketCommentsDB(tx) {
    c++;
    var ticketTotal = localStorage.getItem("ticketTotal");
    var username = localStorage.getItem("username");
    if (c == ticketTotal) {
        tx.executeSql('CREATE TABLE IF NOT EXISTS ticketComments (id INTEGER PRIMARY KEY, username VARCHAR(255), ticketId INT(11), ticketCommentId INT(11), issuer VARCHAR(255), issuerId INT(11), comment TEXT, created VARCHAR(255), read INT(1))');
        tx.executeSql('CREATE TABLE IF NOT EXISTS commentCount (id INTEGER PRIMARY KEY, username VARCHAR(255), count INT(11))');

        var ticketCommentIds = [];
        var ticketComments = '';
        tx.executeSql('SELECT ticketCommentId FROM ticketComments WHERE username = ?', [username], function (tx, result) {
            if (result.rows.length > 0) {
                for (t = 0; t < result.rows.length; t++) {
                    var ids = result.rows.item(t);
                    if (!isNaN(ids['ticketCommentId']))
                        ticketCommentIds.push(ids['ticketCommentId'])
                }
            }

            var theNewArray = new Array();

            for (var i in ticketArr) {
                var notfound = true;
                var ticketComment = ticketArr[i];
                for (var u in ticketCommentIds) {
                    if (ticketComment['id'] == ticketCommentIds[u]) {
                        notfound = false;
                    }
                }

                if (notfound)
                    theNewArray.push(ticketComment);
            }

            if (theNewArray.length > 0) {
                tx.executeSql('SELECT * FROM commentCount WHERE username = ? ORDER BY id desc LIMIT 1', [username], function (tx, result) {
                    console.log(result.rows);
                    if (result.rows.length > 0) {
                        var count = 0;
                        for (r = 0; r < result.rows.length; r++) {
                            var row = result.rows.item(r);
                            count = row['count'];
                        }

                        var newCount = (theNewArray.length + count);
                        console.log(newCount);
                        tx.executeSql('INSERT INTO commentCount (username, count) VALUES ("' + username + '", "' + newCount + '")');
                        localStorage.setItem('commentCount', newCount);
                        if (newCount > 0) {
                            $('.sk-fading-circle')
                                .hide();
                            $('.unread_tickets')
                                .show()
                                .html(newCount);

                        } else {
                            $('.sk-fading-circle')
                                .hide();
                            $('.unread_tickets')
                                .hide();
                        }

                    } else {
                        //console.log(theNewArray.length+' : HELP ME');
                        tx.executeSql('INSERT INTO commentCount (username, count) VALUES ("' + username + '", "' + theNewArray.length + '")');
                        localStorage.setItem('commentCount', theNewArray.length);

                        if (theNewArray.length > 0) {
                            $('.sk-fading-circle')
                                .hide();
                            $('.unread_tickets')
                                .show()
                                .html(theNewArray.length);
                        } else {
                            $('.sk-fading-circle')
                                .hide();
                            $('.unread_tickets')
                                .hide();
                        }

                    }
                });
                //tx.executeSql('INSERT INTO commentCount (count) VALUES ("'+theNewArray.length+'")');

                for (var i in theNewArray) {
                    var newComment = theNewArray[i];
                    tx.executeSql('INSERT INTO ticketComments (username, ticketId, ticketCommentId, issuer, issuerId, comment, created, read) VALUES ("' + username + '", "' + newComment['ticketId'] + '", "' + newComment['id'] + '", "' + newComment['issuer'] + '", "' + newComment['issuerId'] + '", "' + newComment['comment'] + '", "' + newComment['created'] + '", "0")');
                    console.log('inserting'); //$('.ticket_unread_'+newComment['ticketId']).addClass('unread');
                    console.log(newComment['ticketId']);
                    /*$('.ticketInfo_'+newComment['ticketId'] +' td').css('font-weight', '600');
                     $('.ticket_unread_'+newComment['ticketId']).removeClass('read_ticket').addClass('unread');
                     $('.ticketInfo_'+newComment['ticketId']).addClass('unread');
                     $('.ticketInfo_'+newComment['ticketId'] +' td span.ticket_title_span').css('font-weight', '600 !important');
                     $('.unread_title_'+newComment['ticketId']).show();
                     $('.ticketInfo_'+newComment['ticketId']+' td').css('padding-left', '28px');*/

                    $('.ticket_unread_' + newComment['ticketId'])
                        .removeClass('read_ticket')
                        .addClass('unread');
                    $('.ticketInfo_' + newComment['ticketId'])
                        .addClass('unread');
                    $('.ticketInfo_' + newComment['ticketId'] + ' td')
                        .css({
                            'padding-left': '15px'
                            , 'font-weight': '600'
                        });
                    $('.ticketInfo_' + newComment['ticketId'] + ' td span.ticket_title_span')
                        .css('font-weight', '600 !important');
                }
            }
        });

        tx.executeSql('SELECT * FROM commentCount WHERE username = ? ORDER BY id desc LIMIT 1', [username], function (tx, result) {
            //console.log(result);
            var count = 0;
            if (result.rows.length > 0) {
                var row = result.rows.item(0);
                count = row['count'];
                //console.log(count);

                localStorage.setItem('commentCount', count);

                if (count > 0) {
                    $('.sk-fading-circle')
                        .hide();
                    $('.unread_tickets')
                        .show()
                        .html(count);
                } else {
                    $('.sk-fading-circle')
                        .hide();
                    $('.unread_tickets')
                        .hide();
                }

            }

        });
        //console.log(localStorage.getItem('commentCount'));

        tx.executeSql('SELECT * FROM ticketComments WHERE username = ?', [username], function (tx, result) {
            //console.log(result.rows)
        });

        var totalUnread = localStorage.getItem('commentCount');
        if (totalUnread !== null && totalUnread > 0) {
            $('.sk-fading-circle')
                .hide();
            $('.unread_tickets')
                .show()
                .html(totalUnread);
        } else {
            $('.sk-fading-circle')
                .hide();
            $('.unread_tickets')
                .hide();
        }


        //markAsRead(tx);
    }
}

function markAsRead(tx) {
    var username = localStorage.getItem("username");
    tx.executeSql('SELECT MIN(read) as unread, ticketId FROM ticketComments WHERE username = ? GROUP BY ticketId', [username], function (tx, result) {
        if (result.rows.length > 0) {
            for (u = 0; u < result.rows.length; u++) {
                var ur = result.rows.item(u);
                if (!isNaN(ur['unread'])) {
                    if (ur['unread'] == 0) {
                        $('.ticket_unread_' + ur['ticketId'])
                            .removeClass('read_ticket')
                            .addClass('unread');
                        $('.ticketInfo_' + ur['ticketId'])
                            .addClass('unread');
                        $('.ticketInfo_' + ur['ticketId'] + ' td')
                            .css({
                                'padding-left': '15px'
                                , 'font-weight': '600'
                            });
                        $('.ticketInfo_' + ur['ticketId'] + ' td span.ticket_title_span')
                            .css('font-weight', '600 !important');
                    } else {
                        $('.ticket_unread_' + ur['ticketId'])
                            .removeClass('unread')
                            .addClass('read_ticket');
                        $('.ticketInfo_' + ur['ticketId'])
                            .removeClass('unread')
                            .addClass('read_ticket');
                        $('#first_comment_' + ur['ticketId'])
                            .css('font-weight', '300');
                        $('.ticketInfo_' + ur['ticketId'] + ' td')
                            .css('padding-left', '15px');
                        $('.ticketInfo_' + ur['ticketId'] + ' td span')
                            .css({
                                'font-weight': '300'
                            });
                    }
                }
            }
        }
    });
}


function addAdditionalComment(id) {
    //set ID into localstorage for retrieval
    localStorage.setItem('ticketId', id);
    var comment = $('#additionalComment')
        .val();

    if (comment != null && comment != "") {
        swapNavbar(false, null);
        var ticketData = {
            "sessionId": session
            , "ticketId": id
            , "comment": comment
        };

        var params = '?callback=additionaCommentAdded&data=' + encodeURIComponent($.toJSON(ticketData));

        var newScript = document.createElement('script');
        newScript.setAttribute('src', (serviceURL + "Json/Support/addTicketComment") + params);
        document.head.appendChild(newScript);
    } else {
        $("body")
            .scrollTop(0);
        toastr.options = {
            "closeButton": true
            , "debug": false
            , "newestOnTop": false
            , "progressBar": true
            , "positionClass": "toast-top-center"
            , "preventDuplicates": true
            , "onclick": null
            , "showDuration": "300"
            , "hideDuration": "1000"
            , "timeOut": "5000"
            , "extendedTimeOut": "1000"
            , "showEasing": "swing"
            , "hideEasing": "linear"
            , "showMethod": "fadeIn"
            , "hideMethod": "fadeOut"
        };

        toastr.error('No comment present. Your comment cannot be empty.', 'Comment Required');
        var cx = ($(window)
            .width() - 300) / 2;
        $('.toast-top-center')
            .css({
                'left': cx + 'px'
            });
    }

}

function additionaCommentAdded(data) {
    //retrieve the ticketId from localStorage
    var ticketId = localStorage.getItem('ticketId');
    //use ticketId in ticket confirmation
    /* $('#information').show();
     $('#information').text('Comment added to ticket #'+ticketId+' successfully').fadeOut(2500,"linear");*/
    $('#additionalComment')
        .val('');
    localStorage.setItem('message', 'Comment added to ticket #' + ticketId + ' successfully');
    //remove ticketId from localStorage
    localStorage.removeItem('ticketId');
    //$('.raiseTicket').show();
    location.href = 'settings.html';
    //getAllTickets();
}
