injectScripts();

//监听消息
chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		//MPD_URL
		if (request.action == "addMpdUrl") {
			console.log("recieve data");
			console.log(request);

			//这里的变量与外界不互通 所以通过DOM传递
			let _input = document.createElement("input");
			_input.className = "wv_decryptor_data";
			_input.style = "display: none";
			_input.value = JSON.stringify({ mpd_url: request.mpd_url });
			_input.id = escape(_input.value);
			if (!window.top.document.getElementById(_input.id))
				window.top.document.body.appendChild(_input);

			sendResponse('found mpd_url!');
		}
		//pop调用消息
		else if (request.action == "getWvData") {
			//只在顶级窗口做出响应
			if (window.self === window.top) {
				let data = new Array();
				//这里需要再次去重
				var eles = document.getElementsByClassName("wv_decryptor_data");
				Array.prototype.forEach.call(eles, function (ele) {
					if (JSON.stringify(data).indexOf(ele.value) == -1)
						data.push(JSON.parse(ele.value));
				});
				// //遍历iframes
				// Array.prototype.forEach.call(document.getElementsByTagName("iframe"), function (frame) {
				// 	let _eles = frame.contentWindow.document.getElementsByClassName("wv_decryptor_data");
				// 	Array.prototype.forEach.call(_eles, function (ele) {
				// 		if (JSON.stringify(data).indexOf(ele.value) == -1)
				// 			data.push(JSON.parse(ele.value));
				// 	});
				// });
				sendResponse(data);
			}
		}
	}
);


window.addEventListener("message", function (e) {
	//监听更新图标消息
	if (e.data.action == "noticeKey") {
		chrome.runtime.sendMessage({ badgeText: e.data.count });
	}
	//监听新key
	else if (e.data.action == "pushKey") {
		let _input = document.createElement("input");
		_input.className = "wv_decryptor_data";
		_input.style = "display: none";
		_input.value = JSON.stringify(e.data.data);
		_input.id = escape(_input.value);
		window.top.document.body.appendChild(_input);
	}
}, false);


async function injectScripts() {
	//await injectScript('inject_mpd.js'); //弃用，读取responsebody限制多
	await injectScript('lib/pbf.3.0.5.min.js');
	await injectScript('lib/cryptojs-aes_0.2.0.min.js');
	await injectScript('protobuf-generated/license_protocol.proto.js');


	await injectScript('content_key_decryption.js');
	await injectScript('eme_interception.js');
}

function injectScript(scriptName) {
	return new Promise(function (resolve, reject) {
		var s = document.createElement('script');
		s.src = chrome.extension.getURL(scriptName);
		s.onload = function () {
			this.parentNode.removeChild(this);
			resolve(true);
		};
		(document.head || document.documentElement).appendChild(s);
	});
}