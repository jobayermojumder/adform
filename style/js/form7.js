// namespace
Vromansys = {};
Vromansys.Item = {};


Vromansys.Util = new function() {
	var bufferRefs = {};

	return {
		bufferCalls: function(func, ms) {
			return function() {
				if(bufferRefs[func]) {
					clearTimeout(bufferRefs[func]);
				}

				bufferRefs[func] = setTimeout(function() {
					func.apply(this);
					delete bufferRefs[func];
				}, ms);
			};
		},

		createCallback: function(func, args) {
			return function() {
				func.apply(this, args);
			};
		},

		bigCompare: function(val1, val2) {
			if(val1.length < 16 && val2.length < 16) {
				return parseFloat(val1) - parseFloat(val2);
			}

			var sig1 = val1.charAt(0) == "-" ? "-" : "+";
			var sig2 = val2.charAt(0) == "-" ? "-" : "+";

			val1 = val1.replace(/[+-]/g, "");
			val2 = val2.replace(/[+-]/g, "");

			if(val1.indexOf(".") < 0) {
				val1 = val1 + ".";
			}
			if(val2.indexOf(".") < 0) {
				val2 = val2 + ".";
			}

			// left pad
			var len1 = val1.indexOf(".");
			var len2 = val2.indexOf(".");
			for(var i = len1; i < len2; i++) {
				val1 = "0" + val1;
			}
			for(var i = len2; i < len1; i++) {
				val2 = "0" + val2;
			}

			// right pad
			var len1 = val1.length;
			var len2 = val2.length;
			for(var i = len1; i < len2; i++) {
				val1 = val1 + "0";
			}
			for(var i = len2; i < len1; i++) {
				val2 = val2 + "0";
			}

			for(var i = 0, s = val1.length; i < s; i++) {
				var d1 = parseFloat(sig1 + val1.charAt(i));
				var d2 = parseFloat(sig2 + val2.charAt(i));
				var diff = d1 - d2;

				if(diff != 0) {
					return diff; // > or <
				}
			}

			return 0; // ==
		}
	};
}();


Vromansys.Item.Calculation = function(el) {
	var _el = $(el);
	var _form = $(Vromansys.Form.getForm());
	var _button = _el.find("div.calculation button");
	var _span = _el.find("div.calculation span");

	function _handleAjaxComplete(xhr) {
		_button.prop("disabled", false);
	}

	return {
		init: function() {
			_button.on("click", this.doAjaxCalculate);
		},

		getType: function() {
			return "Calculation";
		},

		doAjaxCalculate: function() {
			_button.prop("disabled", true);
			_button.blur();
			_span.html(_span.html().replace(/[0-9]/g, '_'));

			Vromansys.Form.toggleReadOnlyFields(true);

			$.ajax({
				type: "POST",
				url: Vromansys.Form.getActionUrl("submitCalculate"),
				data: _form.serialize() + "&itemId=" + _el.attr("id").substr(1),
				dataType: "text",
				success: function(response) {
					_span.html(response);
				},
				error: function(xhr) {
					alert("Error calculating total. Error code: " + xhr.status);
				},
				complete: _handleAjaxComplete
			});

			Vromansys.Form.toggleReadOnlyFields(false);
		}
	};
};


Vromansys.Item.Signature = function(el) {
	var _el = $(el);
	var _input30 = _el.find("input[name$='_30']");
	var _inputSvg = _el.find("input[name$='_SVG']");
	var _div = _el.find("div.signature");
	var _button = _el.find("div.signature-clear span");

	function _focus() {
		// simulate taking focus
		if($(document.activeElement.tagName).filter(":input").length) {
			document.activeElement.blur();
		}

		_div.click();
		_div.focus();
	}

	return {
		init: function() {
			_div = _div.append("<div></div>").children(":last"); // put inside the signature div instead of on it

			_div.jSignature();

			if(_input30.val()) {
				try {
					_div.jSignature("setData", "data:" + _input30.val());

					this.save();
				} catch(e) {
					// bad data
				}
			}

			_button.on("click", this.clear);
			_el.find("div, span").on("mousedown", _focus);
			_div.on("touchstart", _focus);
			_div.on("change", this.save);
		},

		getType: function() {
			return "Signature";
		},

		clear: function() {
			_input30.val("");
			_inputSvg.val("");
			_div.prev("img").remove();
			_div.jSignature("clear");
		},

		save: function() {
			if(_div.children(":first").tagName != "IMG") {
				var data30 = _div.jSignature("getData", "base30");
				var dataSvg = _div.jSignature("getData", "svg");

				_input30.val(data30);
				_inputSvg.val(dataSvg);
			}
		}
	};
};


Vromansys.Item.CalendarField = function(el) {
	var _el = $(el);
	var _input = _el.find("input.calendar_field");
	var _img = _el.find("img.popup_button");

	return {
		init: function() {
			if(_input.is(":enabled")) {
				_input.datepicker({ altField:_input, changeYear:true, yearRange:"c-100:c+100", showOn:false, dateFormat:_input.attr("date"), maxDate:_input.attr("datemax"), minDate:_input.attr("datemin") });
				_img.on("click", function() { _input.focus(); _input.datepicker("show"); });
			}
		},

		getType: function() {
			return "CalendarField";
		}
	};
};


Vromansys.Item.CountedField = function(el) {
	var _el = $(el);
	var _input = _el.find("input,textarea");
	var _div = _el.find("div.counter");
	var _type = _input.hasClass("count_chars") ? "chars" : "words";
	var _max = _div.html().indexOf('/') == -1 ? false : true;

	function _countChars() {
		// count chars
		return _input.val().length;
	}

	function _countWords() {
		// count words
		var c = 0;
		var w = _input.val().replace(/[\n\r\t]+/g, " ").split(" ");
		for(var i = 0, max = w.length; i < max; i++) {
			if($.trim(w[i]).length > 0) {
				c++;
			}
		}

		return c;
	}

	return {
		init: function() {
			_input.on("keyup", Vromansys.Util.bufferCalls(this.update, 100));

			this.update();
		},

		getType: function() {
			return "CountedField";
		},

		update: function() {
			var c = _type == "chars" ? _countChars() : _countWords();
			var t1 = _div.html();
			var t2 = c + (_max == true ? t1.substring(t1.indexOf('/')) : t1.substring(t1.indexOf(' ')));

			_div.html(t2);
		}
	};
};


Vromansys.Item.FileUpload = function(el) { 
	var _el = $(el);
	var _form = $(Vromansys.Form.getForm());
	var _input = _el.find("input[type=file]");
	var _divFiles = _el.find("div.file_upload_files");
	var _divInfo = _el.find("div.file_upload_info");
	var _files = [];

	function _reset() {
		_input.val("");
		
		if(_input.val().length > 0) {
			// replace input if browser doesn't allow value to be cleared
			_input.replaceWith(_input = _input.clone(true));
		}
		
		_files = [];
		
		_divFiles.find("img.del").off("click").on("click", function() {
			if(!_input.prop("disabled")) {
				var img = $(this);
				
				// show pretend progress
				img.off().closest("div").html('<progress value="75" max="100">75%</progress>');
				
				_doAjaxDelete(img.data("file"));
			}
		});
	}

	function _handleProgress(evn) {
		if (evn.lengthComputable) {
			var n = parseInt(100.0 * evn.loaded / evn.total);
			
			n = Math.min(n, 90);
			
			_divInfo.html('<progress value="' + n + '" max="100">' + n + "%</progress>");
		}
	}

	function _handleAjaxSuccess(json) {
		if(json.status == "success") {
			_divInfo.removeClass("invalid");
			
			if(json.files) {
				_divFiles.empty();
				_divInfo.empty();
				
				for(var i = 0, max = json.files.length; i < max; i++) {
					var file = json.files[i];
					var html;
					
					if(json.showLink) {
						var name2 = file.name.substr(file.name.indexOf("_", file.name.indexOf("_") + 1) + 1);

						html = '<a href="files/' + file.name + '" target="_blank">' + name2 + "</a> (" + file.size + "k)";
					} else {
						html = file.name + " (" + file.size + "k)";
					}
					
					_divFiles.append("<div>" + html +
						' <img class="del" height="18" src="/images/icons/formIcons/delete.svg" data-file="' + i + '" /></div>');
				}
				
				if(json.eparam) {
					Vromansys.Form.appendData("EParam", json.eparam);
				}
			}
		} else {
			// clear upload queue and show error
			_files = [];
			_divInfo.html('<div class="invalid_message">' + json.message + "</div>");
			_divInfo.addClass("invalid");
		}
		
		if(_files.length > 0) {
			// more files
			_doAjaxUpload();
		} else {
			// done
			_reset();
			Vromansys.Form.toggleActionButtons(true);
		}

		// update height
		Vromansys.Form.resizeEmbed();
	}

	function _handleAjaxError(xhr) {
		if(xhr && xhr.status == 500) {
			var msg = xhr.responseText.match(/\(\d+ MB\).+?\(\d+ MB\)/); // magic message extract

			if(msg) {
				// "request size limit exceeded" error
				msg = msg[0];
			} else {
				// generic internal server error
				msg = xhr.statusText;
			}

			_handleAjaxSuccess({status:"error", message:msg});
		} else {
			// submit form to trigger error page
			_form.submit();
		}
	}
	
	function _doAjaxDelete(file) {
		Vromansys.Form.toggleActionButtons(false);
		
		$.ajax({
			type: "POST",
			url: Vromansys.Form.getActionUrl("File"),
			data: _form.find("input[name='EParam']").serialize() + "&itemId=" + _el.attr("id").substr(1) + "&fileId=" + file + "&mode=delete",
			dataType: "json",
			success: _handleAjaxSuccess,
			error: function(xhr) {
				alert("Error deleting existing file. Error code: " + xhr.status);
			}
		});
	}
	
	function _doAjaxUpload() {return;
		var file = _files.shift();
		
		if(file) {
			var data = new FormData();
			
			// reset progress
			_handleProgress({ lengthComputable: true, loaded:1, total:100 });
			
			_form.find("input[name='EParam']").each(function(n, i) {
				data.append("EParam", i.value);
			});
			
			data.append("itemId", _el.attr("id").substr(1));
			data.append(_input.attr("name"), file);
			
			$.ajax({
				type: "POST",
				url: Vromansys.Form.getActionUrl("File"),
				data: data,
				dataType: "json",
				contentType: false,
				processData: false,
				xhr: function() {
					var xhr = $.ajaxSettings.xhr();
					xhr.upload.addEventListener("progress", _handleProgress, false);
					return xhr;
				},
				success: _handleAjaxSuccess,
				error: _handleAjaxError
			});
		}
	}
	
	return {
		init: function() {
			_this = this;
			
			_reset();
			_input.on("change", this.doAjaxUpload);
		},

		getType: function() {
			return "FileUpload";
		},

		doAjaxUpload: function() {
			if(_input.val().length < 1) {
				return; // nothing to do
			}

			if(window.FormData === undefined) {
				alert("Your browser does not support file uploads.");
			} else {
				Vromansys.Form.toggleActionButtons(false);
				
				// pretend upload button
				Vromansys.Form.button = { name:"Upload", value:"Upload" };
				
				var files = _input.prop("files");
				
				for(var i = 0; i < files.length; i++) {
					_files.push(files[i]);
				}
				
				_doAjaxUpload();
			}
		}
	}
};


Vromansys.Item.ImageList = function(el) {
	var _el = $(el);

	function _handleChange() {
		_el.find("input").each(function(n, input) {
			input = $(input);

			if(input.prop("checked")) {
				input.closest(".image_list_image").addClass("selected");
			} else {
				input.closest(".image_list_image").removeClass("selected");
			}
		});
	}

	return {
		init: function() {
			var labels = _el.find("label");
			var inputs = _el.find("input");

			if(navigator.appVersion.indexOf("Trident") > -1) {
				if(navigator.appVersion.indexOf("MSIE 9") > -1 || navigator.appVersion.indexOf("MSIE 10") > -1) {
					// IE 9, 10 fix
					labels.on("click", function(evn) {
						// dummy function
					});
				} else {
					// IE 7, 8, 11 fix
					inputs.on("click", function(evn) {
						evn.stopPropagation();
						_handleChange();
					});

					labels.on("click", function(evn) {
						var input = $(this).find("input");

						input.prop("checked", !input.prop("checked")).change();
						_handleChange();
						input.focus();
					});
				}
			}

			inputs.on("change", _handleChange);
			_handleChange();
		},

		getType: function() {
			return "ImageList";
		}
	}
};

Vromansys.Item.Rating = function(el) {
	var _PATTERN = new RegExp("^[0-9]+$");
	var _el = $(el);
	var _inputs = _el.find("input");
	var _div = _el.find("div.counter");

	function _countPoints() {
		var t = 0;

		_inputs.each(function(n, i) {
			var v = i.value;

			if(v.match(_PATTERN)) {
				t += parseInt(v);
			}
		});

		return t;
	}

	return {
		init: function() {
			_inputs.on("keyup", this.update);

			this.update();
		},

		getType: function() {
			return "Rating";
		},

		update: function() {
			var c = _countPoints();
			var t1 = _div.html();
			var t2 = c + t1.substring(t1.indexOf('/'));

			_div.html(t2);
		}
	};
};


Vromansys.Item.StarMatrix = function(el) {
	var _el = $(el);
	var _table = _el.find("table.matrix_stars");

	function _starSelect(row, count, temp) {
		var stars = row.find(".star");

		stars.each(function(n, star) {
			if(n < count) {
				$(star).addClass("star-on");
			} else {
				$(star).removeClass("star-on");
			}

			if(!temp) {
				$(star).prop("onmouseover", null);
				$(star).prop("onmouseout", null);
			}
		});

		if(!temp) {
			row.find("input").val("Radio-" + (count - 1));
		}
	}

	return {
		init: function() {
			var rows = _table.find("tr");

			rows.each(function(n1, r) {
				r = $(r);

				var stars = r.find(".star");

				stars.each(function(n2, s) {
					$(s).on("click", Vromansys.Util.createCallback(_starSelect, [ r, n2 + 1 ]));
				});
			});
		},

		getType: function() {
			return "StarMatrix";
		}
	};
};


Vromansys.Item.TextList = function(el) {
	var _el = $(el);
	var _inputs = _el.find("input");
	var _table = _el.find("table.text_list");
	var _max = _el.find("input[name=MaxAnswers]").val();

	function _handleEnter(evn) {
		if(evn.which == 13) {
			evn.preventDefault();

			_addRow($(this).parents("tr"));
		}
	}

	function _renumberRows() {
		_table.find("tr").each(function(n, r) {
			r = $(r)

			if(n % 2 == 0) {
				r.addClass("matrix_row_light");
				r.removeClass("matrix_row_dark");
			} else {
				r.addClass("matrix_row_dark");
				r.removeClass("matrix_row_light");
			}

			var i = r.find("input").get(0);
			i.name = i.name.substring(0, i.name.lastIndexOf('-') + 1) + n;
		});
	}

	function _addRow(row) {
		if(_table.find("tr").length >= _max) {
			return; // max reached
		}

		var html = row.html().replace(/ id=| value=/ig, " junk="); // don't duplicate id or value in cloned input
		row = $(row).after("<tr>" + html + "</tr>").next("tr");

		var _inputs = _el.find("input");
		var input = row.find("input");

		_renumberRows();

		// setup events
		row.find("td img.add").on("click", Vromansys.Util.createCallback(_addRow, [ row ]));
		row.find("td img.del").on("click", Vromansys.Util.createCallback(_removeRow, [ row ]));
		input.on("keypress", _handleEnter);

		// init new input
		Vromansys.Form.addHighlight(input, [ "click", "focus" ]);
		input.focus();

		// if embeded, need to update height for added row
		Vromansys.Form.resizeEmbed();
	}

	function _removeRow(row) {
		if(_table.find("tr").length < 2) {
			return; // min reached
		}

		row.remove();

		_renumberRows();

		// if embeded, need to update height for removed row
		Vromansys.Form.resizeEmbed();
	}

	return {
		init: function() {
			var rows = _table.find("tr");

			rows.each(function(n, r) {
				r = $(r);

				r.find("td img.add").on("click", Vromansys.Util.createCallback(_addRow, [ r ]));
				r.find("td img.del").on("click", Vromansys.Util.createCallback(_removeRow, [ r ]));
				r.find("input").on("keypress", _handleEnter);
			});
		},

		getType: function() {
			return "TextList";
		}
	};
};


Vromansys.Form = new function() {
	var _form = null;
	var _timeStart = $.now();
	var _elActive = null;

	function _highlightFocus() {
		if(_elActive) {
			_elActive.removeClass("highlight");
		}

		_elActive = $(this).parents("tr[class*='matrix_row'], .q").first();

		if(_elActive) {
			_elActive.addClass("highlight");
		}
	}

	function _evalItemRules(ruleNbrs) {
		// helper function
		function isMet(criteria, inputs) {
			var matched = false;

			if(inputs == null) {
				// item is not on the page - act like its blank
				if(criteria.answer == "") {
					matched = true;
				}

				return matched == (criteria.operator == "==");
			}

			var firstEl = inputs[0];

			if(firstEl.tagName == "SELECT") {
				// check select
				if(criteria.answer == -1) {
					// wildcard
					if(firstEl.selectedIndex > 0) {
						matched = true;
					}
				} else {
					var parts = firstEl.value.split("-"); // "value-x"

					if(parts.length > 0 && parts[1] == criteria.answer) {
						matched = true;
					}
				}
			} else if(firstEl.tagName == "TEXTAREA" || firstEl.type == "text" || firstEl.type == "hidden" || firstEl.type == "password" || firstEl.type == "number" || firstEl.type == "email" || firstEl.type == "url") {
				// check text field
				if($(firstEl).hasClass("number_field") && criteria.answer != "") {
					// numerical compare
					var val1 = firstEl.value;
					var val2 = criteria.answer;

					// match backend
					val1 = val1.replace(/[^0-9a-zA-Z-.]/g, "");
					val2 = val2.replace(/[^0-9a-zA-Z-.]/g, "");

					if(!$.isNumeric(val1) || !$.isNumeric(val2)) {
						// nothing valid to compare
					} else {
						var diff = Vromansys.Util.bigCompare(val1, val2);

						if(criteria.operator == "==" || criteria.operator == "!=") {
							matched = diff == 0;
						} else if(criteria.operator == ">") {
							matched = diff > 0;
						} else if(criteria.operator == "<") {
							matched = diff < 0;
						}
					}
				} else {
					// textual compare
					if(firstEl.value.toLowerCase() == criteria.answer.toLowerCase()) {
						matched = true;
					}
				}
			} else {
				// check multi-choice item
				for(var i = 0, max = inputs.length; i < max; i++) {
					if(inputs[i].checked) {
						if(criteria.answer == -1) {
							// wildcard
							matched = true;
						} else {
							var parts = inputs[i].value.split("-"); // "value-x"

							if(parts[1] == criteria.answer) {
								matched = true;
							}
						}

						if(matched) {
							break;
						}
					}
				}
			}

			if(criteria.operator == "!=") {
				matched = !matched;
			}

			return matched;
		}

		for(var i = 0, maxI = ruleNbrs.length; i < maxI; i++) {
			var el = $("#q" + ruleNbrs[i]);
			var rule = itemRules[ruleNbrs[i]];
			var matched = (rule.join == "&&");
			var criteria = rule.criteria;

			// check the answer to each criteria item
			for(var j = 0, maxJ = criteria.length; j < maxJ; j++) {
				var criteriaEl = document.getElementById("q" + criteria[j].item);
				var inputs = null;
				var toggled = false;

				if(criteriaEl) {
					if($(criteriaEl).hasClass("x-hidden")) {
						// pretend hidden item doesn't exist
					} else {
						inputs = $(criteriaEl).find("input,select,textarea").get();
					}
				}

				if(isMet(criteria[j], inputs)) {
					if(rule.join == "||") {
						matched = true; // OR - if one thing is true, everything is true
						break;
					}
				} else {
					if(rule.join == "&&") {
						matched = false; // AND - if one thing is false, everything is false
						break;
					}
				}
			}

			if(matched == (rule.action == "show")) {
				// met to show or not met to hide
				if(el.hasClass("x-hidden")) {
					el.removeClass("x-hidden");
					el.find(":input").not(".read_only").removeAttr("disabled");
					toggled = true;
				}
			} else {
				// met to hide or not met to show
				if(!el.hasClass("x-hidden")) {
					el.addClass("x-hidden");
					el.find(":input").attr("disabled", "disabled");
					toggled = true;
				}
			}

			if(toggled) {
				var nextRuleNbrs = el.prop("ruleNbrs");

				if(nextRuleNbrs) {
					// cascade to dependants
					_evalItemRules(nextRuleNbrs);
				}
			}
		}

		// if embeded, need to update height for show/hide
		Vromansys.Form.resizeEmbed();
	}

	return {
		init: function() {
			_form = $("#FSForm");

			var items = _form.find(".q");

			// force buttons enabled
			Vromansys.Form.toggleActionButtons(true);

			// force read only
			Vromansys.Form.toggleReadOnlyFields(false);

			// highlighting on click/focus
			var els = $(items).find("button, input, select, textarea, .star, .signature");
			els.on("click", _highlightFocus); // safari/chrome doesn't support onfocus for checks/radios
			els.on("focus", _highlightFocus);

			// calendars
			var els =  $(items).has("input.calendar_field");
			els.each(function(i, el) {
				var newItem = new Vromansys.Item.CalendarField(el);
				newItem.init();
			});

			// counted fields
			var els =  $(items).has("textarea.count_chars, textarea.count_words, input.count_chars, input.count_words");
			els.each(function(i, el) {
				var newItem = new Vromansys.Item.CountedField(el);
				newItem.init();
			});
			
			// file uploads
			var els =  $(items).has("input.file_upload");
			els.each(function(i, el) {
				var newItem = new Vromansys.Item.FileUpload(el);
				newItem.init();
			});

			// ratings
			var els =  $(items).has("table.count_rating");
			els.each(function(i, el) {
				var newItem = new Vromansys.Item.Rating(el);
				newItem.init();
			});

			// +/- matrices
			var els =  $(items).has("table.text_list");
			els.each(function(i, el) {
				var newItem = new Vromansys.Item.TextList(el);
				newItem.init();
			});

			// star matrices
			var els =  $(items).has("table.matrix_stars");
			els.each(function(i, el) {
				var newItem = new Vromansys.Item.StarMatrix(el);
				newItem.init();
			});

			// calculations
			var els =  $(items).has("button.calculation_button");
			els.each(function(i, el) {
				var newItem = new Vromansys.Item.Calculation(el);
				newItem.init();
			});

			// signatures
			var els =  $(items).has("div.signature");
			els.each(function(i, el) {
				var newItem = new Vromansys.Item.Signature(el);
				newItem.init();
			});

			// image lists
			var els =  $(items).has("table.image_list");
			els.each(function(i, el) {
				var newItem = new Vromansys.Item.ImageList(el);
				newItem.init();
			});

			// instructions
			var els =  $(items).has("img.instructions");
			els.each(function(i, el) {
				$(el).tooltip({ items: "img.instructions", content: instructions[el.id.substr(1)]});
			});

			// "other" fields
			var els = $(items).find("input.other_field");
			els.each(function(i, el) {
				$(el).on("keyup", function() {
					if(this.value.length > 0) {
						$(this).prevAll("input").not(":checked").click();
					}
				});
			});

			// keep track of submit buttons
			var els = _form.find("input[type=submit], button[type=submit]");
			els.on("click", function() {
				Vromansys.Form.button = this;
			});

			// show/hide rules
			if(typeof itemRules != "undefined") {
				for(var i in itemRules) {
					var rule = itemRules[i];
					var criteria = rule.criteria;

					for(var j = 0, max = criteria.length; j < max; j++) {
						if(criteria.answer == -1) {
							continue; // wildcard - nothing to do
						}

						var criteriaEl = document.getElementById("q" + criteria[j].item);

						if(!criteriaEl) {
							continue; // item is not on the page
						}

						if(!criteriaEl.ruleNbrs) {
							criteriaEl.ruleNbrs = [];

							var evalCallback = Vromansys.Util.createCallback(_evalItemRules, [ criteriaEl.ruleNbrs ]);
							evalCallback = Vromansys.Util.bufferCalls(evalCallback, 100); // buffer for typing, rapid clicks, etc

							// text fields
							var inputs = $(criteriaEl).find("input[type=text],input[type=password],input[type=number],input[type=email],input[type=url],textarea");
							inputs.on("change", evalCallback); // pastes and such
							inputs.on("keyup", evalCallback); // typing

							// multi-choices
							var inputs = $(criteriaEl).find("input[type=checkbox],input[type=radio],select");
							inputs.on("change", evalCallback); // some cases need this
							inputs.on("click", evalCallback); // some cases need that
						}

						// store the rule numbers that need evaluation when this item changes
						if($.inArray(i, criteriaEl.ruleNbrs) < 0) {
							criteriaEl.ruleNbrs.push(i);
						}
					}

					_evalItemRules([i]); // evaluate the rule to init
				}
			}
			
			// reCaptcha
			var el = $(".g-recaptcha");
			if(el.length > 0) {
				window["Vromansys.Form.solveCaptcha"] = Vromansys.Form.solveCaptcha; // reCaptcha expects exact name in window
				$(".outside_container .buttons_reverse").hide().find("input[type=submit]").prop("disabled", true);
				Vromansys.Form.resizeEmbed();
			}
		},

		addHighlight: function(el, ons) {
			// handle one or more
			if(!$.isArray(ons)) {
				ons = [ ons ];
			}

			$.each(ons, function(i, on) {
				$(el).on(on, _highlightFocus);
			});
		},

		resizeEmbed: Vromansys.Util.bufferCalls(function() {
			if (typeof Embed != "undefined") {
				Embed.publishHeight(false);
			}
		}, 100),
		
		solveCaptcha: function() {
			$(".g-recaptcha").hide();
			$(".outside_container .buttons_reverse").show().find("input[type=submit]").prop("disabled", false);
			Vromansys.Form.resizeEmbed();
		},

		toggleActionButtons: function(state) {
			state = !state;
			
			$("#FSsubmit").prop("disabled", state);
			$("#FSpreviousSubmit").prop("disabled", state);
			$("#FSclose").prop("disabled", state);
			$("#FSsavePartialWork").prop("disabled", state);
			$("#FSbackButton").prop("disabled", state);
			//$("input[type=file]:not(.read_only)").prop("disabled", state);
		},

		toggleReadOnlyFields: function(state) {
			state = !state; // no means yes

			_form.find("input.read_only, select.read_only, textarea.read_only").prop("disabled", state);
		},

		getForm: function() {
			return _form.get(0);
		},

		getActionUrl: function(action) {
			var url;

			if(action) {
				if(action.indexOf("submit") === 0) {
					url = _form.attr("action").substring(0, _form.attr("action").lastIndexOf("/")) + "/";
				} else {
					url = _form.attr("action");
				}

				if(url.indexOf(";") > -1) {
					url = url.replace(";", action + ";");
				} else {
					url += action;
				}
			} else {
				url = _form.attr("action");
			}

			return url;
		},

		appendData: function(name, value) {
			_form.append('<input type="hidden" name="' + name + '" value="' + value + '" />');
		},

		processSubmit: function() {
			Vromansys.Form.toggleActionButtons(false);

			// include button info
			if(Vromansys.Form.button) {
				_form.append('<input type="hidden" name="' + Vromansys.Form.button.name + '" value="' + Vromansys.Form.button.value + '" />');
			}

			// record stats
			var inputTime = _form.find("input[name='ElapsedTime']");
			inputTime.val(parseInt(inputTime.val()) + ($.now() - _timeStart));
			var inputReferrer = _form.find("input[name='Referrer']");
			inputReferrer.val(inputReferrer.val().length > 0 ? inputReferrer.val() : document.referrer);

			Vromansys.Form.toggleReadOnlyFields(true);

			return true;
		}
	};
}();


$(document).ready(Vromansys.Form.init);
$(window).on("unload", function() { /* dummy function to prevent back/forward cache */ });
