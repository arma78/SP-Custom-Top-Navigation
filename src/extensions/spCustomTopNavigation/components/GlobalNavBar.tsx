import * as React from 'react';
import { sp } from "@pnp/sp";
import "@pnp/sp/lists";
import "@pnp/sp/sites";
import "@pnp/sp/content-types/list";
import "@pnp/sp/content-types";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/features";
import "@pnp/sp/site-users/web";
import "@pnp/sp/fields";
import "@pnp/sp/folders";
import { AppCatalog } from '@pnp/sp/appcatalog';
import "@pnp/sp/user-custom-actions";
import { IOpenWebByIdResult } from "@pnp/sp/sites";
import "@pnp/sp/security";
import { HttpClient, SPHttpClient, HttpClientConfiguration, HttpClientResponse, ODataVersion, IHttpClientConfiguration, IHttpClientOptions, ISPHttpClientOptions } from '@microsoft/sp-http'; 
import {
  Logger,
  ConsoleListener,
  LogLevel
} from "@pnp/logging";
import { IUserCustomActionAddResult, IUserCustomActionUpdateResult } from '@pnp/sp/user-custom-actions';
import "@pnp/sp/clientside-pages/web";
import "@pnp/sp/comments/clientside-page";
import styles from './GlobalNavBar.module.scss';
import { IGlobalNavBarProps } from './IGlobalNavBarProps';
import { IGlobalNavBarState } from './IGlobalNavBarState';
import "@pnp/sp/site-groups/web";
import pnp, { TypedHash } from 'sp-pnp-js';
import * as pn from 'sp-pnp-js';
import { Dialog, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { PrimaryButton, DefaultButton,Button } from 'office-ui-fabric-react/lib/Button';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { PermissionKind } from '@pnp/sp/security';
import { IUserCustomAction } from '@pnp/sp/user-custom-actions';
import { Web } from '@pnp/sp/webs';
import { SiteGroup } from 'sp-pnp-js/lib/sharepoint/sitegroups';
 require('@outboxcraft/beauter/src/beauter.css');
var audio: any = "";


export default class GlobalNavBar extends React.Component<IGlobalNavBarProps, IGlobalNavBarState> {


  constructor(props: IGlobalNavBarProps, state: IGlobalNavBarState) {
    super(props);


    sp.setup({
      spfxContext: this.context,
      defaultCachingStore: "session", // or "local"
      defaultCachingTimeoutSeconds: 900,
      globalCacheDisable: false // or true to disable caching in case of debugging/testing
    });
    audio = new Audio(this.props.UrlRootSite + "/siteassets/beep.mp3");
    
   
    this.state = ({ depItems: [], items: [], hideDialog: true, isVisible: false, showCAButtons: "none"});
  }



  protected functionUrl: string = "https://soltechnalicensing.azurewebsites.net/api/SubscriptionValidator";    
  protected callAzureFunction(): void {    
    const requestHeaders: Headers = new Headers();
    requestHeaders.append("Content-type", "text/plain");
    requestHeaders.append("Cache-Control", "no-cache");
   
    var userName: any = "Armin";
     
        console.log(`SiteUrl: , UserName: '${userName}'`);    
        const postOptions: IHttpClientOptions = {    
        headers: requestHeaders,    
        body: `{ name: '${userName}' }`    
      };    
        let responseText: string = "";    
      let resultMsg: HTMLElement = document.getElementById("responseContainer");    
        this.context.httpClient.post(this.functionUrl, HttpClient.configurations.v1, postOptions).then((response: HttpClientResponse) => {    
         response.json().then((responseJSON: any) => {    
            responseText = JSON.stringify(responseJSON);    
            if (response.ok) {    
                resultMsg.style.color = "white";    
            } else {    
                resultMsg.style.color = "red";    
            }    
    
            resultMsg.innerText = responseJSON.name;    
          })    
          .catch ((response: any) => {    
            let errMsg: string = `WARNING - error when calling URL ${this.functionUrl}. Error = ${response.message}`;    
            resultMsg.style.color = "red";    
            console.log(errMsg);    
            resultMsg.innerText = errMsg;    
          });    
      });   
  }

  public async componentDidMount(): Promise<void> {
    
    await this.VerifyListExist();
    await this.getdepts();
    const isVIsible: boolean = await this.checkUserPermission();
    this.setState({ isVisible: isVIsible });
  }

  private async getSPDatabyID() {
    const x: any = await sp.web.currentUser.get();
    return x.LoginName;
  } 

  private async getSPData() {
    const _web = Web(this.props.UrlRootSite);
    const x: any = await _web.currentUser.get();
    return x.Email;
  }

  private async updateCustomAction(ev) {
    
    const userisAuth: boolean = await this.checkUserPermission();
    const _web = Web(this.props.UrlRootSite);
    if (userisAuth == true) {
      var txt1 = (document.getElementById("headerColorId") as HTMLInputElement);
      var txt2 = (document.getElementById("subMenuColorId") as HTMLInputElement);
      var txt3 = (document.getElementById("FontColorId") as HTMLInputElement);
      var checkBoxEmpAuth = (document.getElementById("EmpowerAuthorization") as HTMLInputElement);
      var authNav: boolean = false;
      if (checkBoxEmpAuth.checked == true) {
         authNav = true;
      } else {
        authNav = false;
      }
      var url:any = "";
      const field2d: any = await _web.lists.getByTitle("Top Navigation SP List").fields.getByTitle("Department").get();
      let ar: any[] = field2d.Choices;
      let me: any = ev.target;
      var itms: any = document.getElementById('headerCurrent');
      var custAct: any = itms.querySelectorAll("p");
      for (var k = 0; k < custAct.length; k++) {
        if (custAct[k].id === me.id) {
          var selectedHeader = custAct[k].getAttribute("className");
          url =  ar.filter(option => option.startsWith(selectedHeader));
        }
      }


        var someString = url.toString();
      var index = someString.indexOf(",");
      var HeaderUrl = "";
      HeaderUrl = someString.substr(index + 1);
      var web2 = Web(HeaderUrl);
      var CAID: string = "";
        const userCustomActions: any = await web2.userCustomActions();
        for (var i = 0; i < userCustomActions.length; i++) {
          if (userCustomActions[i].Title === "Custom Top Navigation") {
            CAID = userCustomActions[i].Id;
          }
        }
        const newValues: TypedHash<string> = {
          "Title": "Custom Top Navigation",
          "Name": "SpCustomTopNavigationApplicationCustomiz",
          "ClientSideComponentId":"5b87aecb-6bc0-4077-952f-1318f7faa7f1",
          "Location": "ClientSideExtension.ApplicationCustomizer",
          "ClientSideComponentProperties": '{"UrlRootSite":"' + this.props.UrlRootSite + '","TopBackground":"' + txt1.value + '","FontColor":"' + txt3.value + '","MenuITembBgColor":"' + txt2.value + '","EmpowerAuthorization":"' + authNav.toString() + '"}'
        };

        if (Boolean(CAID) == true) {
          const uca = web2.userCustomActions.getById(CAID);
          const response: IUserCustomActionUpdateResult = uca.update(newValues);
          console.log(response + "Custom Action Updated!");
        }
        else {
          const response: IUserCustomActionAddResult = await web2.userCustomActions.add(newValues);
          console.log(response + "Custom Action Added!");
        }
 
      sessionStorage.clear();
      setTimeout(() => { console.log("Custom Action Applied!"); }, 3000);
      window.location.href = HeaderUrl;
     }
  }
  private async checkUserPermission() {
  
    const usrEmail: string = await this.getSPData();
  

    const ownerGroup = await sp.web.associatedOwnerGroup();
    const usersO = await sp.web.siteGroups.getById(ownerGroup.Id).users();
    let authorized : boolean = false;
    let authorizedo: boolean = false;
     for (var k = 0; k < usersO.length; k++) {
       if (usersO[k].Email === usrEmail) {
        authorizedo = true;
         break;
       }
    }
    if (authorizedo === true) {
      return authorized = true;
    }
    return authorized;
  }



  private handleLoad(e, a) {

    var closer: any = document.querySelectorAll(".dropdown-content");
    for (var k = 0; k < closer.length; k++)
     {
     var x = closer[k].childElementCount;

     if (x === 0)
     {
       var z = closer[k].id;
       var images: any = document.querySelectorAll(".imageArrow");
       for (var l = 0; l < images.length; l++) {
         if(images[l].id === z)
         {
          images[l].style.display = 'none';
         }
        }
     }
    }
  }

  private async addCssFile() {

    // get Site Assets library
    const _web = Web(this.props.UrlRootSite);
    const siteAssetsList = await _web.lists.ensureSiteAssetsLibrary();
    if (siteAssetsList) {
      // get the Title
      const r = await siteAssetsList.select("Title")();
      // log Title
      var file:File = new File(["../components/assets/beep.mp3"], "beep.mp3", { type: "audio/mp3" });
      await sp.web.lists.getByTitle("Site Assets").rootFolder.files.add(file.name, file, true);
      var file2:File = new File(["../components/assets/LogoImg.png"], "LogoImg.png", { type: "image/png" });
      await sp.web.lists.getByTitle("Site Assets").rootFolder.files.add(file2.name, file2, true);
      console.log("Beep.mp3 and LogoImg.png files were added into your Site Assets List");
    }
    else {
      alert("Site Assets Library Missing in your root site!");
    }
    }

  private async VerifyListExist() {

     const _web = Web(this.props.UrlRootSite);
    await this.addCssFile();
   
      const listEnsureResult = await _web.lists.ensure("Top Navigation SP List");
    if (listEnsureResult.created) {
        await this.addCssFile();
        await sp.web.lists.getByTitle("Top Navigation SP List").fields.addMultiChoice("Department", ["Home," + this.props.UrlRootSite], true, { Group: "TopNavigationSPList" });
        await sp.web.lists.getByTitle("Top Navigation SP List").fields.getByTitle("Department").setShowInDisplayForm(true);
        await sp.web.lists.getByTitle("Top Navigation SP List").fields.getByTitle("Department").setShowInNewForm(true);
        await sp.web.lists.getByTitle("Top Navigation SP List").fields.getByTitle("Department").setShowInEditForm(true);

        await sp.web.lists.getByTitle("Top Navigation SP List").fields.addText("UrlNav", 255, { Group: "TopNavigationSPList" });
        await sp.web.lists.getByTitle("Top Navigation SP List").fields.getByTitle("UrlNav").setShowInDisplayForm(true);
        await sp.web.lists.getByTitle("Top Navigation SP List").fields.getByTitle("UrlNav").setShowInNewForm(true);
        await sp.web.lists.getByTitle("Top Navigation SP List").fields.getByTitle("UrlNav").setShowInEditForm(true);

        await sp.web.lists.getByTitle("Top Navigation SP List").fields.addText("ImageUrl", 255, { Group: "TopNavigationSPList" });
        await sp.web.lists.getByTitle("Top Navigation SP List").fields.getByTitle("ImageUrl").setShowInDisplayForm(true);
        await sp.web.lists.getByTitle("Top Navigation SP List").fields.getByTitle("ImageUrl").setShowInNewForm(true);
        await sp.web.lists.getByTitle("Top Navigation SP List").fields.getByTitle("ImageUrl").setShowInEditForm(true);
        console.log("Top Navigation SP List was created!");
        alert("Top Navigation SP List was created!");
      } else {
        console.log("Top Navigation SP List already exist!");
      }
    
      
  }

  public async checkSiteExists(webUrl: string): Promise<WebExistsObj> {

    try {
      // Make new web from url    
      const web = new pn.Web(webUrl);

      // Try to get web and only select Title
      const webWithTitle = await web.select('Title').get();

      // If web does exist make a return object and return
      if (webWithTitle.Title.length > 0) {
        const returnObj: WebExistsObj = {
          url: webUrl,
          doesExists: true,
          status: 200
        };
        return returnObj;
      }

    }
    catch (error) {

      // If status is 403 it does exist but you don't have permissions
      // If 404 it just doesn't exist
      const exists = error.status === 403 ? true : false;

      const returnObj: WebExistsObj = {
        url: webUrl,
        doesExists: exists,
        status: error.status
      };
      return returnObj;
    }
  }


  public async getdepts(): Promise<void> { 
    const _web = Web(this.props.UrlRootSite);
    const field2: any = await _web.lists.getByTitle("Top Navigation SP List").fields.getByTitle("Department").usingCaching().get();
    if (this.props.EmpowerAuthorization === 'true') {
      for (var i = 0; i < field2.Choices.length; i++) {
        var someString = field2.Choices[i];
        var returnData: any = "";
        var index = someString.indexOf(",");
        var HeaderUrl = someString.substr(index + 1);
         returnData = await this.checkSiteExists(HeaderUrl);
        if (returnData.status == 403 || returnData.status == 404 || returnData.status == 401) {
            field2.Choices.splice(i, 1);
        }
      }
    }
    const items:any = await _web.lists.getByTitle("Top Navigation SP List").items
      .select("Id", "Title", "Department", "UrlNav", "ImageUrl")
      .orderBy("Created", false).usingCaching().get();
    this.setState({ depItems: field2.Choices, items: items });
  }

 
  public topnav(event, idTopNav: string) {
    audio.play();
   if (screen.width > 1024) {
      var closer: any = document.querySelectorAll(".dropdown-content");
      for (var k = 0; k < closer.length; k++) {
        closer[k].style.display = 'none';
      }
    }
    var a = document.getElementById("myTopnav2");
    a.classList.contains("responsive") ? a.className = a.className.replace("responsive", "") : a.className += " responsive";
  }


  private showsub(e, s) {
    audio.play();
    var closer: any = document.querySelectorAll(".dropdown-content");
    for (var k = 0; k < closer.length; k++) {
      if (closer[k].id !== "s"+ s){
      closer[k].style.display = 'none';
      }
      else
      {
        closer[k].style.display = 'block';
      }
    }
  }

  private hidesub(e) {
    var closer: any = document.querySelectorAll(".dropdown-content");
    for (var k = 0; k < closer.length; k++) {
      closer[k].style.display = 'none';
    }
  }
  private _closeDialog = (): void => {
    this.setState({ hideDialog: true });
  }

 


  private _showSection = (): void => {
    var checkBox = (document.getElementById("CAChecker") as HTMLInputElement);
    // Get the output text
    var CA_Section = (document.getElementById("CASection") as HTMLDivElement);
    var itms: any = document.getElementById('headerCurrent');
    var eventCA: any = itms.querySelectorAll("b");
    // If the checkbox is checked, display the output text
    if (checkBox.checked == true) {
      CA_Section.style.display = "block";
      for (var i = 0; i < eventCA.length; i++) {
        eventCA[i].style.display = "block";
      }
    } else {
      CA_Section.style.display = "none";
      for (var j = 0; j < eventCA.length; j++) {
        eventCA[j].style.display = "none";
      }
    }
   
  }
      
  private async _removeNavItem(ev) {
    const _web = Web(this.props.UrlRootSite);
    const userisAuth: boolean = await this.checkUserPermission();
    if (userisAuth == true) {
      const field2d: any = await _web.lists.getByTitle("Top Navigation SP List").fields.getByTitle("Department").get();
      let ar: any[] = field2d.Choices;
      let me: any = ev.target;
      var itms: any = document.getElementById('headerCurrent');
      var eventRemove: any = itms.querySelectorAll("p");
      for (var k = 0; k < eventRemove.length; k++) {
        if (eventRemove[k].id === me.id) {
          var selectedHeader = eventRemove[k].getAttribute("className");
          ar.filter(option => option.startsWith(selectedHeader));
          ar.splice(k, 1);
        }
      }
      await _web.lists.getByTitle("Top Navigation SP List").fields.getByTitle("Department").update({
        Choices: { results: ar }
      });

      itms.innerHTML = "";
      for (var j = 0; j < ar.length; j++) {
        var someString = ar[j];
        var index = someString.indexOf(",");
        var Header = someString.substr(0, index);
        itms.innerHTML += "<p  className=" + Header + " id=" + j + ">" + Header + "<span className='removeItemsClass' id='" + j + "' style='background:#0078D4; color:white; float:right; padding:2px; cursor:pointer'>Remove</span></p>";
      }
      sessionStorage.clear();
      window.location.reload();
    }
  }
 
  public async _showDialog(e) {
    const _web = Web(this.props.UrlRootSite);
    const userisAuth: boolean = await this.checkUserPermission();
    if (userisAuth == true) {
      this.setState({ hideDialog: false });
      const field2d: any = await _web.lists.getByTitle("Top Navigation SP List").fields.getByTitle("Department").get();
      var itms: any = document.getElementById('headerCurrent');
      let ar: any[] = field2d.Choices;
      itms.innerHTML = "";
      for (var i = 0; i < ar.length; i++) {
        var someString = ar[i];
        var index = someString.indexOf(",");
        var Header = someString.substr(0, index);
        itms.innerHTML += "<p  className=" + Header + " id=" + i + ">" + Header + "<span className='removeItemsClass' id='" + i + "' style='font-weight: bold;background:#0078D4; color:white; float:right; padding:2px; cursor:pointer'>Remove</span><b className='updatecssClass' id='" + i + "' style='background:#0078D4; color:white; float:right; padding:2px;display:inline-block;margin-right:8px;display:none; cursor:pointer'>Custom Action</b></p>";
      }
      var eventRemove: any = itms.querySelectorAll("span");
      for (var k = 0; k < eventRemove.length; k++) {
        eventRemove[k].addEventListener('click', (event) => {
          this._removeNavItem(event);
        });
      }
      var eventCA: any = itms.querySelectorAll("b");
      for (var z = 0; z < eventCA.length; z++) {
        eventCA[z].addEventListener('click', (event) => {
          this.updateCustomAction(event);
        });
      }
    }
  }

  private async setupDepts() {
    const _web = Web(this.props.UrlRootSite);
    const userisAuth: boolean = await this.checkUserPermission();
    if (userisAuth == true) {
      const field2d: any = await _web.lists.getByTitle("Top Navigation SP List").fields.getByTitle("Department").get();
      var itms: any = document.getElementById('headerCurrent');
      var headerNameId: string = (document.getElementById('headerNameId') as HTMLInputElement).value;
      var headerURlId: string = (document.getElementById('headerURlId') as HTMLInputElement).value;
      const siteUrl = headerURlId;
      const exists = await sp.site.exists(siteUrl);
      if (exists) {
        let ar: any[] = field2d.Choices;
        ar.push(headerNameId + "," + headerURlId);

        await _web.lists.getByTitle("Top Navigation SP List").fields.getByTitle("Department").update({
          Choices: { results: ar }
        });
        itms.innerHTML = "";
        for (var j = 0; j < ar.length; j++) {
          var someString = ar[j];
          var index = someString.indexOf(",");
          var Header = someString.substr(0, index);
          itms.innerHTML += "<p  className=" + Header + " id=" + j + ">" + Header + "<span className='removeItemsClass' id='" + j + "' style='font-weight: bold;background:#0078D4; color:white; float:right; padding:2px; cursor:pointer'>Remove</span><b className='updatecssClass' id='" + j + "' style='background:#0078D4; color:white; float:right; padding:2px;display:inline-block;margin-right:8px;display:none; cursor:pointer'>Custom Action</b></p>";
        }
        sessionStorage.clear();
        window.location.reload();
      } else {
        alert("Your Site - " + headerNameId + " , Does not Exist Yet!, Please Create Site First.");
      }
    }
  }

  public render(): React.ReactElement<IGlobalNavBarProps> {
   
   return (
     <div className={styles.app} >
       <div id="responseContainer"></div>
       <button id="btnCallAzureFunction" onClick={this.callAzureFunction.bind(this)}>Say Hello!</button>    
       <div>
         <Dialog hidden={this.state.hideDialog}
           title='Top Navigation Settings'
           subText='Settings to Add or Remove the top navigation items, and apply the Custom Action.'
           onDismiss={this._closeDialog}
           isBlocking={true}
           maxWidth="700px"
           dialogContentProps={{
           className: 'dialogadd'
           }}
         >

           <div style={{ padding: '6px', backgroundColor: '#ACE5EE', borderColor: 'navy', borderWidth: '1px', borderStyle: 'solid' }}>
             <input type="checkbox" id="CAChecker" name="CAChecker" onClick={this._showSection} />
             <label htmlFor="CAChecker">Check to enable the Custom Action on Desired Site:</label>
             <div id="CASection" className="CASection" style={{ display: 'none' }}>
               <Label>Type Desired Background Color for the Top Nav Headers:</Label>
               <input type="text" aria-expanded="true" style={{ width: '25em' }} id='headerColorId' name="headerColorName" />
               <Label>Type Desired Background Color for the Top Nav Sub-Menu:</Label>
               <input type="text" aria-expanded="true" style={{ width: '25em' }} id='subMenuColorId' name="subMenuColorName" />
               <Label>Type Font-Color for the Top Navigation:</Label>
               <input type="text" aria-expanded="true" style={{ width: '25em' }} id='FontColorId' name="FontColorName" />
               <br></br>
               <input type="checkbox" id="EmpowerAuthorization" name="EmpowerAuthorization" />
               <label htmlFor="EmpowerAuthorization">Check to enable the  Site Access Authorization on the Top Navigation:</label>
               <br></br>
               <Label>Once You have Filled the Required Text Boxes, Click on the 'Custom Action'  below to apply the Custom Action and CSS on Desired Site.</Label>
             </div>
           </div>
           <Label><b>Current Top Navigation Header Items:</b></Label>
           <div id='headerCurrent' style={{ padding: '6px', backgroundColor: '#ACE5EE', borderColor: 'navy', borderWidth: '1px', borderStyle: 'solid', marginBottom:'14px' }}>
            </div>
          
           <div style={{ padding: '6px', backgroundColor: '#ACE5EE', borderColor: 'navy', borderWidth: '1px', borderStyle:'solid'  }}>
            
            

             <Label>Add New Header Navigation Item Name:</Label>
             <input type="text" aria-expanded="true" style={{width: '25em' }}  id='headerNameId' name="headerName" />
           <Label>Add New Header Navigation Item Url:</Label>
             <input type="text" aria-expanded="true" style={{ marginBottom: '14px', width: '25em'}}  id='headerURlId' name="headerUrl" />
           <br></br>
             <PrimaryButton onClick={this.setupDepts.bind(this)} text="Add" />
           </div>
           <br></br>
           <a href={this.props.UrlRootSite + "/Lists/Top%20Navigation%20SP%20List/NewForm.aspx"}>Click to Add Sub-Menu Items</a>
           <br></br>
           <DialogFooter>
               <DefaultButton onClick={this._closeDialog} text="Close" />
           </DialogFooter>
         </Dialog>
       </div>
       <div className={styles.top}>

         <ul className="topnav" id="myTopnav2" style={{ backgroundColor: this.props.TopBackground}}>
           {this.state.depItems.length > 0 && this.state.depItems.map((listItem1, a) => {
             var someString = listItem1;
             var index = someString.indexOf(",");
             var Header = someString.substr(0, index);
             var HeaderUrl = someString.substr(index + 1);
             return (
                 <li>
                   {a == 0 ? <img src={this.props.UrlRootSite + "/siteassets/LogoImg.png"} width="42px" height="42px" style={{ float: 'left' }} /> : ""}
                   <a id={"s" + a} href={HeaderUrl} style={{ color: this.props.FontColor, borderRightStyle: "solid", borderLeftStyle: 'solid', borderRightColor: '#ba9c16', borderLeftColor: '#ba9c16', borderRightWidth: '1px', borderLeftWidth: '1px' }}
                     className="dropdown">{Header}</a>
                   <img className="imageArrow" id={"s" + a} onLoad={(event) => this.handleLoad(event, a)} onClick={(event) => this.showsub(event, a)} src={require('../components/assets/white-drop-down.png')} width="10px" height="10px" style={{ textAlign: 'center', paddingTop: "20px", caretColor: 'orange', cursor: 'pointer' }} />
                   <div id={"s" + a} onMouseLeave={(event) => this.hidesub(event)} className='dropdown-content' style={{ backgroundColor: this.props.MenuITembBgColor }}>
                     {this.state.items.length > 0 && this.state.items.map((listItem, z) => {
                       var someString2 = listItem.Department[0];
                       var index2 = someString2.indexOf(",");
                       var Header2 = someString2.substr(0, index2);
                       return (
                         <>
                           {Header === Header2 ? <a style={{ color: this.props.FontColor }} id={Header === Header2 ? listItem.Id : ""} href={Header === Header2 ? listItem.UrlNav : ""}>{Header === Header2 ? listItem.Title : ""}<img src={Header === Header2 ? listItem.ImageUrl : ""} width="19px" height="19px" style={{ paddingTop: "5px", paddingLeft: "15px", float: 'right', textAlign: 'center' }} /></a> : ""}
                         </>
                       );
                     })
                     }
                   </div>
                 </li>
                 );
                })
              }


            <li className="-icon">
            <a href="#" onClick={(event) => this.topnav(event, "myTopnav2")}>☰</a>
           </li>
           {this.state.isVisible == true ? <li> <a href="#" onClick={(event) => this._showDialog(event)}>Settings</a></li> : ""}
          </ul>
        </div>
      </div>
    );
  }
}
// Class for return onject
export class WebExistsObj {
 public url: string;
 public status: number;
 public doesExists: boolean;
}



