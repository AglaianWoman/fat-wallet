/*ko.extenders.formatDate = function(target, option) {
    //create a writable computed observable to intercept writes to our observable
    var result = ko.pureComputed({
        read: function() {
          target("testing");
        }
    }).extend({ notify: 'always' });

    //initialize with current value to make sure it is rounded appropriately
    result(target());

    //return the new computed observable
    return result;
};*/

function convertDateToString(date) {
  var format_date = date;
  var arr1 = format_date.split("T");
  if(arr1.length) {
    var arr2 = arr1[0].split("-");
    if(arr2.length==3) {
      format_date = arr2[1]+"/"+arr2[2]+"/"+arr2[0];
    }
  }

  return format_date;
}

ko.bindingHandlers.formatDate = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        var val = valueAccessor();
        var value = ko.unwrap(valueAccessor());
        var arr1 = value.split("T");
        if(arr1.length) {
          var arr2 = arr1[0].split("-");
          if(arr2.length==3) {
            value = arr2[1]+"/"+arr2[2]+"/"+arr2[0];
          }
        }

        if(element.tagName=="INPUT") {
          $(element).val(value);
        } else {
          $(element).text(value);
        }

        //ko.bindingHandlers.val.update(element,valueAccessor);
        val(element.value);
    },
    update: function (element, valueAccessor, allBindingsAccessor) {
        var val = valueAccessor();
        console.log(val);
        //ko.bindingHandlers.val.update(element,valueAccessor);

        var value = ko.unwrap(valueAccessor());
        var arr1 = value.split("T");
        if(arr1.length) {
          var arr2 = arr1[0].split("-");
          if(arr2.length==3) {
            value = arr2[1]+"/"+arr2[2]+"/"+arr2[0];
          }
        }

        if(element.tagName=="INPUT") {
          $(element).val(value);
        } else {
          $(element).text(value);
        }

        //ko.bindingHandlers.val.update(element,valueAccessor);
        val(value);

    }
};


// transaction item model
function TransactionItem(data) {
    this.id = ko.observable(data.id);
    this.transaction_id = ko.observable(data.transaction_id);

    this.description = ko.observable(data.description);

    this.grand_total = ko.observable(data.grand_total);
    this.discount_total = ko.observable(data.discount_total);
    this.tax_total = ko.observable(data.tax_total);
    this.quantity = ko.observable(data.quantity);
    this.created_at = ko.observable(data.created_at);
    this.updated_at = ko.observable(data.updated_at);
}

// transaction model
function Transaction(data) {
  this.id = ko.observable(data.id);

  this.description = ko.observable(data.description);

  // cost totals information
  this.grand_total    = ko.observable(Number.parseFloat(data.grand_total));
  this.tax_total      = ko.observable(Number.parseFloat(data.tax_total));
  this.discount_total = ko.observable(Number.parseFloat(data.discount_total));
  this.tax_rate       = ko.observable(Number.parseFloat(data.tax_rate));
  // date information
  var transaction_date = convertDateToString(data.transaction_date);
  this.transaction_date = ko.observable(transaction_date);
  this.created_at       = ko.observable(data.created_at);
  this.updated_at       = ko.observable(data.updated_at);

  // items for the transaction
  this.transaction_items = ko.observableArray(data.transaction_items);

  // fields for each individual transaction to add items to it.
  this.tiDescription = ko.observable();
  this.tiQuantity = ko.observable(1);
  this.tiGrandTotal = ko.observable("0.00");
  this.tiDiscountTotal = ko.observable("0.00");
  this.tiTaxTotal = ko.observable("0.00");

  this.toggle_transaction_items = ko.observable(false);
};

function DatesViewing() {
  this.start_date = ko.observable();
  this.end_date = ko.observable();
  this.date_view_type = ko.observable();
  this.date_counter = ko.observable(0);
  this.limit_amount = ko.observable(0);
  this.date_range = ko.observable();
}
function CurrentWeek() {
  this.days_from_current_date = ko.observable(0);
  this.current_week_start = ko.observable();
  this.current_week_end = ko.observable();
  this.full_week = ko.observable();
}

function CurrentMonth() {
  this.current_year = ko.observable();
  this.current_month = ko.observable();
  this.months_from_current_date = ko.observable(0);
}

function WeeklyGoal() {
  this.start_date = ko.observable();
  this.end_date = ko.observable();
  this.id = ko.observable();
  this.limit_amount = ko.observable(100.00);
}

function MonthlyGoal() {
  this.month = ko.observable();
  this.year =  ko.observable();
  this.id = ko.observable();
  this.limit_amount = ko.observable(1000.00);
}

// the transaction view model that stores transaction array and operations for individual transaction
function TransactionViewModel() {
    var t = this;
    t.transactions = new ko.observableArray([]);

    t.current_week = new CurrentWeek();
    // fields to add new transaction
    t.newTransactionDescription = ko.observable();
    t.newTransactionGrandTotal = ko.observable();
    t.newTransactionDiscountTotal = ko.observable("0.00");
    t.newTransactionTaxTotal = ko.observable("0.00");
    t.newTransactionTaxRate = ko.observable("0.00");
    t.newTransactionDate = ko.observable();


    t.datesViewing = new DatesViewing();
    t.datesViewing.date_view_type('week');
    //t.weeklyGoal = new WeeklyGoal();//ko.observable(100.00);
    //t.viewBy = ko.observable("week");

    // get transactions
    t.loadTransactions = function() {
      $.getJSON("/transactions.json", function(raw) {
          var transactions = $.map(raw.transactions, function(item) {
            item.transaction_items = Array();
            // build transaction items to add to transaction
            if(raw.transaction_items[item.id]!==undefined) {
              transaction_items_temp = $.map(raw.transaction_items[item.id],function(trans_item) {
                return new TransactionItem(trans_item);
              });

              item.transaction_items = transaction_items_temp;
            }// end if

            return new Transaction(item);
          }); // $.map
          console.log(transactions);
          t.transactions(transactions);
      }); // end $.getJSON
    };

    // pull the dates we are currently viewing
    t.loadViewDate = function() {
      $.getJSON("/view_dates.json",function(raw) {
        t.setViewDate.call(t.datesViewing,raw);
      });
    }

    t.setViewDate = function(data) {
      this.date_range(data.date_range);
      this.start_date(data.start_date);
      this.end_date(data.end_date);
      this.date_view_type(data.date_view_type);
      this.date_counter(data.date_counter);
    }

    t.updateViewDate = function(data) {
      $.ajax({
           url: "/view_dates.json",
           type: "POST",
           data: data
      }).done(function(res){
          t.setViewDate.call(t.datesViewing,res);
          t.reloadTransactions();
          //t.loadCurrentWeeklyGoal();
      });

    };

    t.toggleView = function(data) {
      console.log(data);
      t.datesViewing.date_view_type(data.type);
      t.updateViewDate(ko.toJS(t.datesViewing));
    }

    //t.set

    /*t.loadCurrentWeekInfo = function() {
      $.getJSON("/week_dates.json",function(raw){
        t.setCurrentWeek.call(t.current_week,raw);
      });
    };

    // get week info
    t.setCurrentWeek = function(data) {
      this.days_from_current_date(data.days_from_current_date);
      this.current_week_start(data.current_week_start);
      this.current_week_end(data.current_week_end);
      this.full_week(data.full_week);
    }
    */

    t.loadCurrentWeeklyGoal = function() {
        $.getJSON("/weekly_goals.json",function(raw){
          if(raw.weekly_goal!="undefined" && raw.status=="success") {
            t.setCurrentWeeklyGoal.call(t.weeklyGoal,raw.weekly_goal);
          } else {
            t.setCurrentWeeklyGoal.call(t.weeklyGoal,{limit_amount:100.00,start_date:"",end_date:"",id:null});
          }
        });
    };

    t.saveCurrentWeeklyGoal = function(data) {
      var id = ko.unwrap(data.id());
      if(id!==undefined && id!==null) {
        data._method = 'put';
      }
      //console.log(data);
      var jsonData = ko.toJS(data);
      $.ajax({
        url: "/weekly_goals.json",
        type: "POST",
        data: jsonData

      }).done(function(res){
        if(res.weekly_goal!==undefined) {
          t.setCurrentWeeklyGoal.call(t.weeklyGoal,res.weekly_goal);
          /*t.weeklyGoal.id(res.weekly_goal.user_id);
          t.weeklyGoal.limit_amount(res.weekly_goal.limit_amount);
          t.weeklyGoal.start_date(res.weekly_goal.start_date);
          t.weeklyGoal.end_date(res.weekly_goal.end_date);*/
        }
        if(res.errors!==undefined) {
          alert(res.errors.join("<br />"));
        }
      });
    }


    // load info for the first time
    t.loadTransactions();
    t.loadViewDate();
    //t.loadCurrentWeeklyGoal();



    t.getDifferentWeek = function(data) {
      $.ajax({
           url: "/week_dates.json",
           type: "POST",
           data: data
      }).done(function(res){
          t.setCurrentWeek.call(t.current_week,res);
          t.reloadTransactions();
          t.loadCurrentWeeklyGoal();
      });

    };

    t.toggleWeek = function() {
        if(t.viewBy=='week') {
            return;
        }
        t.viewBy('week');
    };

    t.toggleMonth = function() {
    console.log("toggle month");
        if(t.viewBy=='month') {
            return;
        }

        t.viewBy('month');
    };

    t.reloadTransactions = function() {
      t.transactions.removeAll();
      t.loadTransactions();
    };

    //calculate combined total for each transaction
    t.combinedTotal = ko.pureComputed({
      owner: t,
      read: function() {
        var total = 0;
        for(var p =0; p < this.transactions().length; p++) {
          // skip any destroyed items in observable array
          if(this.transactions()[p]._destroy!==undefined && this.transactions()[p]._destroy==true) {continue;}
          total += Number.parseFloat(this.transactions()[p].grand_total());
        }
        return Number.parseFloat(total).toFixed(2);
      },
      deferEvaluation: true
    });

    t.availableLimit = ko.pureComputed({
      owner: t,
      read: function() {
        return (this.datesViewing.limit_amount() - this.combinedTotal()).toFixed(2);
      }
    });

    // builds new transaction item from fields and sends ajax request to save into backend model
    t.addTransaction = function() {

      //console.log("submitted unsing neter key");
      //return;
        var newTransaction = new Transaction({
          description: this.newTransactionDescription(),
          grand_total: this.newTransactionGrandTotal(),
          tax_total: this.newTransactionTaxTotal(),
          tax_rate: this.newTransactionTaxRate(),
          discount_total: this.newTransactionDiscountTotal(),
          transaction_date: this.newTransactionDate()
        });

        //t.transactions.push(newTransaction);
        t.saveTransaction(newTransaction);
        t.resetFormFields();
    };

    t.updateTransaction = function(transaction,event) {
        if(event.keyCode!=13) {return;}
        console.log(transaction);
        //console.log(transaction);console.log(event);return;
        transaction._method = "put";
        t.saveTransaction(transaction);
        return true;
    };

    t.testTransaction = function(d,e) {
      //console.log(transaction);
      console.log(d);
      console.log(e);
    }

    t.deleteTransaction = function(transaction) {
      transaction._method = "delete";
      t.transactions.destroy(transaction);
      t.saveTransaction(transaction);
    };

    t.resetFormFields = function() {
      this.newTransactionDescription("");
      this.newTransactionGrandTotal("");
      this.newTransactionDiscountTotal("0.00");
      this.newTransactionTaxTotal("0.00");
      this.newTransactionTaxRate("0.00");
      this.newTransactionDate("");
    };
    t.setCurrentWeeklyGoal = function(data) {
      this.start_date(data.start_date);
      this.end_date(data.end_date);
      this.id(data.id);
      this.limit_amount(data.limit_amount);
    }

    t.saveTransaction = function(transaction) {
      var myData = ko.toJS(transaction);
      $.ajax({
           url: "/transactions.json",
           type: "POST",
           data: myData
      }).done(function(data){
          if(data.transaction!==undefined && data.status!="failure"){
            if(data.type!==undefined && data.type=="new") {
              t.transactions.push(transaction);
            }
            
            transaction.id(data.transaction.id);
            var transaction_date = convertDateToString(data.transaction.transaction_date);
            transaction.transaction_date(transaction_date);
            transaction.created_at(data.transaction.created_at);
            transaction.updated_at(data.transaction.updated_at);
          } else if(data.errors!==undefined) {
            var errors = "";
            for(var i=0; i < data.errors.length;i++) {
              errors += data.errors[i]+"<br />";
            }
            alert(errors);
          }
      });
    };



    /****
    * Methods for Transaction Items
    ****/
    t.toggleDisplayTransactionItems = function(transaction) {
      console.log(transaction);
      var toggleVal = ko.unwrap(transaction.toggle_transaction_items());
      toggleVal = !toggleVal;
      transaction.toggle_transaction_items(toggleVal);
    }

    /*t.getTransactionItems = function(transaction) {
      $.getJSON("/transaction_items.json",{transaction_id: transaction.id}, function(raw) {
          //var transactions = $.map(raw.transactions, function(item) { return new Transaction(item) });
          //t.transactions(transactions);
      });
    };*/

    t.addTransactionItem = function(transaction,event) {
      if(event.keyCode!=13) {
        return;
      }
      //console.log(transaction);return;
      // create new transaction item
      var newTransactionItem = new TransactionItem(
        {
          description: transaction.tiDescription,
          grand_total: transaction.tiGrandTotal,
          discount_total: transaction.tiDiscountTotal,
          tax_total: transaction.tiTaxTotal,
          quantity: transaction.tiQuantity,
          transaction_id: transaction.id
        }
      );
      t.saveTransactionItem(newTransactionItem,transaction);
      t.reserTransactionItemFields(transaction);
    };

    t.updateTransactionItem = function(transactionItem,event) {
      if(event.keyCode!=13) {
        return;
      }
      console.log("saving");
      transactionItem._method = "put";
      t.saveTransactionItem(transactionItem);
      return true;
    };

    t.deleteTransactionItem = function(data) {
      data.transaction_item._method="delete";
      t.saveTransactionItem(data.transaction_item, data.transaction);
    };

    // sends request to api for add, update and delete
    // and takes appropriate measures to handle response depending on what operation we originally issued
    t.saveTransactionItem = function(transactionItem,transaction) {
      var jsonData = ko.toJS(transactionItem);
      $.ajax({
           url: "/transaction_items.json",
           type: "POST",
           data: jsonData
      }).done(function(data){
          // if successful in saving, update valuess
          if(data.transaction_item!==undefined && data.status=="success"){
            transactionItem.id(data.transaction_item.id);
            transactionItem.grand_total(data.transaction_item.grand_total);
            transactionItem.discount_total(data.transaction_item.discount_total);
            transactionItem.tax_total(data.transaction_item.tax_total);
            transactionItem.description(data.transaction_item.description);
            transactionItem.created_at(data.transaction_item.created_at);
            transactionItem.updated_at(data.transaction_item.updated_at);
            transactionItem.quantity(data.transaction_item.quantity);
            transactionItem.transaction_id(data.transaction_item.transaction_id);
          }
          // check what type of operation we wanted
          if(data.method!==undefined) {
            if(data.method=="add") {
              transaction.transaction_items.push(transactionItem);
            } else if(data.method="delete") {
              transaction.transaction_items.destroy(transactionItem);
            }
          }


      });
    };

    t.reserTransactionItemFields = function(transaction) {
      transaction.tiDescription("");
      transaction.tiGrandTotal("0.00");
      transaction.tiDiscountTotal("0.00");
      transaction.tiTaxTotal("0.00");
      transaction.tiQuantity(1);
    }
  };

  // initialize ko.
  ko.applyBindings(new TransactionViewModel());
