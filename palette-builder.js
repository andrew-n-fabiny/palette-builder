(function(window, $, undefined) {
	var class_grid = 'pb-grid';
	var class_cell = 'pb-cell';
	var class_color = 'pb-cpick';
	var color_default = '#010101';
	
	var getInputColor = function(input) {
		var cell = input.parent();
		if(isAddState(cell)) return averageColors(getAdjacent(cell));
		return input.val();
	}

	var target_click = function() {
		var input = $(this);
		var cell = input.parent();
		var color = getInputColor(input);
		input.spectrum('set', color);
	};
	var input_click = function(evt) {
		var input = $(this);
		var cell = input.parent();
		var color = getInputColor(input);

		input.spectrum({
			color: color,
			preferredFormat: "hex6",
			showInput: true,
			showInitial: true,
			showPalette: true,
			showSelectionPalette: true,
			localStorageKey: "palette-builder.palette",
			palette: [['#ffffff']],
			beforeShow: target_click
		});
		input.spectrum('show');
		return false; 
	};
	
	var input_change = function(evt) {
		var input = $(this);
		var cell = input.parent();
		
		if(input.val().toLowerCase() === '#ffffff') {
			input.val(color_default);
			cell.css('background-color', '');
			collapseCell(cell);
			return;
		}
		
		cell.removeClass('alone');
		if(isAddState(cell)) {
			expandCell(cell);
		}
		cell.css('background-color', input.val());
	};
	
	var averageColors = function(cells) {
		var cell, color, r = 0, g = 0, b = 0, count = 0;
		for(var i = 0, len = cells.length; i < len; i++) {
			cell = cells[i];
			if(isFilledState(cell)) {
				color = cell.find('.' + class_color).val();
				r += parseInt(color.substr(1,2), 16);
				g += parseInt(color.substr(3,2), 16);
				b += parseInt(color.substr(5,2), 16);
				count++;
			}
		}
		if(count === 0) return '#ffffff';
		return '#' + 
			padCHex(Math.floor(r / count).toString(16)) + 
			padCHex(Math.floor(g / count).toString(16)) + 
			padCHex(Math.floor(b / count).toString(16));
	};
	var padCHex = function(s) {
		return s.length === 2 ? s : '0' + s;
	};
	
	var expandCell = function(cell) {
		setFilledState(cell);
		
		var row = cell.parent();
		var grid = row.parent();
		
		var index = cell.prevAll().length;
		var count = row.children().length;
		
		var left = cell.prev();
		var right = cell.next();
		
		if(left.length === 0) {
			grid.children().prepend(buildCell(true));
			left = cell.prev();
			count++;
			index++;
		}
		if(right.length === 0) {
			grid.children().append(buildCell(true));
			right = cell.next();
			count++;
		}
		if(row.prev().length === 0) {
			grid.prepend(buildRow(count, true));
		}
		if(row.next().length === 0) {
			grid.append(buildRow(count, true));
		}
		
		var top = $(row.prev().children()[index]);
		var bottom = $(row.next().children()[index]);
		
		if(isHiddenState(left)) setAddState(left);
		if(isHiddenState(right)) setAddState(right);
		if(isHiddenState(top)) setAddState(top);
		if(isHiddenState(bottom)) setAddState(bottom);
	};
	var collapseCell = function(cell) {
		setAddState(cell);
		
		var grid = cell.parent().parent();
		
		var adj = getAdjacent(cell);
		for(var i = 0, len = adj.length; i < len; i++) {
			tryHideCell(adj[i]);
		}
		
		if(countAddCells(grid) > 1) {
			tryHideCell(cell);
		}
		else {
			cell.addClass('alone');
		}
		
		tryTrimGrid(grid);
	};
	var tryHideCell = function(cell) {
		if(isFilledState(cell)) return;
		var adj = getAdjacent(cell);
		for(var i = 0, len = adj.length; i < len; i++) {
			if(isFilledState(adj[i])) {
				return;
			}
		}
		setHiddenState(cell);
	};
	var tryTrimGrid = function(grid) {
		var set;
		
		set = $();
		do {
			set.remove();
			set = grid.children().find('.' + class_cell + ':first');
		} while(!isAddState(set));
		
		set = $();
		do {
			set.remove();
			set = grid.children().find('.' + class_cell + ':last');
		} while(!isAddState(set));
		
		set = $();
		do {
			set.remove();
			set = grid.children().first();
		} while(!isAddState(set.children()));
		
		set = $();
		do {
			set.remove();
			set = grid.children().last();
		} while(!isAddState(set.children()));
	};
	
	var getAdjacent = function(cell) {
		var row = cell.parent();
		var index = cell.prevAll().length;
		return [
			cell.prev(),
			cell.next(),
			$(row.prev().children()[index]),
			$(row.next().children()[index])];
	};
	
	var isFilledState = function(cell) {
		return cell.hasClass('filled');
	};
	var isAddState = function(cell) {
		return cell.hasClass('add');
	};
	var isHiddenState = function(cell) {
		return cell.hasClass('hidden');
	};
	
	var setFilledState = function(cell) {
		cell.addClass('filled');
		cell.removeClass('add');
		cell.removeClass('hidden');
	};
	var setAddState = function(cell) {
		cell.addClass('add');
		cell.removeClass('filled');
		cell.removeClass('hidden');
	};
	var setHiddenState = function(cell) {
		cell.addClass('hidden');
		cell.removeClass('filled');
		cell.removeClass('add');
	};
	
	var countAddCells = function(grid) {
		return grid.find('.add').length;
	};
	
	var buildCell = function(hidden, alone) {
		var select = $('<input>', window.document);
		select.addClass(class_color);
		select.attr('type', 'color');
		
		var cell = $('<td>');
		cell.addClass(class_cell);
		if(alone) cell.addClass('alone');
		if(hidden) setHiddenState(cell);
		else setAddState(cell);
		cell.append(select);
		return cell;
	};
	var buildRow = function(count, hidden, alone) {
		var row = $('<tr>');
		for(var i = 0; i < count; i++) {
			row.append(buildCell(hidden, alone));
		}
		return row;
	};
	var buildGrid = function(parent) {
		var row = buildRow(1, false, true);
		
		var table = $('<table>');
		table.addClass(class_grid);
		table.append(row);
		table.on('click', '.' + class_color, input_click);
		table.on('change', '.' + class_color, input_change);
		return table;
	};
	
	var initEach = function(index, element) {
		$(element).append(buildGrid());
	};
	var init = function(targets) {
		$(targets).each(initEach);
	};
	
	window.palette = {
		build: init
	};
})(window, $);