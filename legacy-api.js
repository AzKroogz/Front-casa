(function (L) {
  'use strict';
  var config=window.__APP_CONFIG__||{};
  L.baseUrl=String(config.SUPABASE_URL||'').replace(/\/$/,'');
  L.apiKey=String(config.SUPABASE_PUBLISHABLE_KEY||'');
  L.sessionKey='casa_legacy_session_v1'; L.session=null; L.householdId=null; L.currentUserId=null; L.tasks=[]; L.memberNames={};
  function saveSession(next) { L.session=next; try { localStorage.setItem(L.sessionKey,JSON.stringify(next)); } catch (error) {} }
  function loadSession() { try { var v=localStorage.getItem(L.sessionKey); return v?JSON.parse(v):null; } catch (error) { return null; } }
  function clearSession() { L.session=null; try { localStorage.removeItem(L.sessionKey); } catch (error) {} }
  function xhr(method,path,body,useAuth,prefer) {
    return new Promise(function (resolve,reject) {
      var r=new XMLHttpRequest(); r.open(method,L.baseUrl+path,true); r.setRequestHeader('apikey',L.apiKey); r.setRequestHeader('Content-Type','application/json');
      if (useAuth&&L.session&&L.session.access_token) r.setRequestHeader('Authorization','Bearer '+L.session.access_token); if (prefer) r.setRequestHeader('Prefer',prefer);
      r.onreadystatechange=function () { var data=null,msg,err; if (r.readyState!==4) return; try { data=r.responseText?JSON.parse(r.responseText):null; } catch (error) { data=r.responseText; }
        if (r.status>=200&&r.status<300) { resolve(data); return; }
        msg=data&&(data.message||data.msg||data.error_description||data.error)?(data.message||data.msg||data.error_description||data.error):'HTTP '+r.status; err=new Error(msg); err.status=r.status; reject(err); };
      r.onerror=function () { reject(new Error('No se pudo conectar con Casa.')); }; r.send(body===null||typeof body==='undefined'?null:JSON.stringify(body));
    });
  }
  function refreshSession() { if (!L.session||!L.session.refresh_token) return Promise.reject(new Error('Sesión vencida')); return xhr('POST','/auth/v1/token?grant_type=refresh_token',{refresh_token:L.session.refresh_token},false).then(function (data) { saveSession(data); L.currentUserId=data.user&&data.user.id?data.user.id:L.currentUserId; return data; }); }
  function api(method,path,body,prefer,retried) { return xhr(method,path,body,true,prefer).catch(function (error) { if (error.status===401&&!retried&&L.session&&L.session.refresh_token) return refreshSession().then(function () { return api(method,path,body,prefer,true); }); throw error; }); }
  function signIn(email,password) { return xhr('POST','/auth/v1/token?grant_type=password',{email:email,password:password},false).then(function (data) { saveSession(data); L.currentUserId=data.user.id; return data; }); }
  function loadTasks() { if (!L.householdId) return Promise.resolve(); return api('GET','/rest/v1/tasks?select=*&household_id=eq.'+encodeURIComponent(L.householdId)+'&order=created_at.asc',null).then(function (rows) { var next=[],i; for (i=0;i<(rows||[]).length;i+=1) next.push(L.rowToTask(rows[i])); L.tasks=next; L.render(); L.updateSleepView(); }); }
  function loadHousehold() {
    return api('GET','/rest/v1/household_members?select=household_id,role&limit=1',null).then(function (m) { if (!m||!m.length) throw new Error('Tu cuenta existe, pero todavía no tiene acceso a Casa.'); L.householdId=m[0].household_id; return api('GET','/rest/v1/household_members?select=user_id,role&household_id=eq.'+encodeURIComponent(L.householdId),null); }).then(function (members) {
      var ids=[],i; for (i=0;i<members.length;i+=1) ids.push(members[i].user_id); if (!ids.length) return {members:members,profiles:[]};
      return api('GET','/rest/v1/profiles?select=user_id,display_name&user_id=in.('+ids.join(',')+')',null).then(function (profiles) { return {members:members,profiles:profiles||[]}; });
    }).then(function (ctx) { var i; L.memberNames={}; for (i=0;i<ctx.profiles.length;i+=1) L.memberNames[ctx.profiles[i].user_id]=ctx.profiles[i].display_name; L.populateAssignees(ctx.members); return loadTasks(); });
  }
  function createTask(task) { var p=L.taskToRow(task); p.household_id=L.householdId; p.created_by=L.currentUserId; return api('POST','/rest/v1/tasks',p,'return=representation').then(loadTasks); }
  function updateTask(id,task) { return api('PATCH','/rest/v1/tasks?id=eq.'+encodeURIComponent(id)+'&household_id=eq.'+encodeURIComponent(L.householdId),L.taskToRow(task),'return=representation').then(loadTasks); }
  function deleteTask(id) { return api('DELETE','/rest/v1/tasks?id=eq.'+encodeURIComponent(id)+'&household_id=eq.'+encodeURIComponent(L.householdId),null).then(loadTasks); }
  L.saveSession=saveSession; L.loadSession=loadSession; L.clearSession=clearSession; L.refreshSession=refreshSession; L.signIn=signIn; L.loadHousehold=loadHousehold; L.loadTasks=loadTasks; L.createTask=createTask; L.updateTask=updateTask; L.deleteTask=deleteTask;
}(window.CasaLegacy = window.CasaLegacy || {}));
