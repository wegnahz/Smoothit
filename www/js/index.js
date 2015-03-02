var clientId = '656534411560-adakgaficm4bb64i3q4hotm43es740uh.apps.googleusercontent.com';
var apiKey = 'AIzaSyA3NRYUuDsgS1M-sZRkFwzhl3FHfgcihXo';
var scopes = 'https://www.googleapis.com/auth/calendar';

function handleClientLoad() {
    gapi.client.setApiKey(apiKey);
    window.setTimeout(checkAuth,1);
}

function checkAuth() {
    gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: true}, handleAuthResult);
}

function handleAuthResult(authResult) {
    var $loginStatus = $('#input p');
    var authorizeButton = $('#login-btn');
    var calendar_id = null;
    if (authResult && !authResult.error) {
        $(':mobile-pagecontainer').pagecontainer('change', '#p2');
        $.ajax(
            'https://www.googleapis.com/calendar/v3/users/me/calendarList',
            {
                async:   false, 
                type: 'GET',
                dataType: 'json',
                headers: {
                    'Authorization': 'Bearer ' + authResult.access_token
                },
                success: function (resp) {
                    var list = resp.items;
                    $.each(list, function(i, e) {
                        //console.log(e.accessRole + ' ' + e.id + ' ' + e.kind);
                        if (e.accessRole === 'owner') calendar_id = e.id;
                    });
                }
            }                
        );
        var current_date = new Date();
        var time_min = current_date.toISOString();
        var end_date = new Date();
        end_date.setDate(current_date.getDate()+30);
        var time_max = end_date.toISOString();
        console.log("calendar_id: " + calendar_id );
        console.log(time_min + " " + time_max);
        if (calendar_id !== null) {
            $.ajax(
                'https://www.googleapis.com/calendar/v3/calendars/' + calendar_id + '/events',
                {
                  type: 'GET',
                  dataType: 'json',
                  data: {
                    'timeMin' : time_min,
                    'timeMax' : time_max
                  },
                  headers: {
                    'Authorization': 'Bearer ' + authResult.access_token
                  },
                  success: function (resp) {
                    $('#event-list li').remove();
                    var list = resp.items;
                    var cnt = 0;
                    $.each(list, function(i, e) {
                        var StartDateTime = e.start.dateTime.split(/\T(\d{2}\:\d{2})/);
                        var EndDateTime = e.end.dateTime.split(/\T(\d{2}\:\d{2})/);
                        ++cnt;
                        var button_id = 'event-' + cnt;
                        $('#event-list').append(
                            '<li><a class=\"ui-btn ui-btn-inline\" id=\"' + button_id + '\"> <h4>' + e.summary + '</h4>'
                            + '<p>' + e.location + '</p>'
                            + '<p>' + StartDateTime[1] + ' - ' + EndDateTime[1] + '</p>'
                            + '<p class="ui-li-aside">' + StartDateTime[0] + '</p></a></li>'
                        );
                        $('#'+button_id).on('click', function(e) {
                            console.log(e.id);
                            $('#alert-event').append('There is an traffic jam on event "' + list[0].summary + '".');
                            $(':mobile-pagecontainer').pagecontainer('change', '#p3');
                        });
                    });
                    $('#event-list').listview('refresh');
                    /*setTimeout(function(){ 
                        $('#alert-event').append('There is an traffic jam on event "' + list[0].summary + '".');
                        $(':mobile-pagecontainer').pagecontainer('change', '#p3');
                    }, 30000);*/
                  },
                  error: function (jqXHR, textStatus, errorThrown) {
                    $loginStatus.html(textStatus);
                  }
                }
            );
        }
    } else {
        $loginStatus.html('access denied.');
        $(':mobile-pagecontainer').pagecontainer('change', '#p2');
    }
}

function handleAuthClick(event) {
    gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: false}, handleAuthResult);
    return false;
}

$(document).on('ready', function() {
    var $loginButton = $('#login a');
    var $loginStatus = $('#input p');

    $loginButton.on('click', function(e) {
        handleAuthClick(e);
    });
});