import List "mo:core/List";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type Category = {
    #food;
    #tea;
    #coolDrink;
    #petrol;
    #fruits;
    #recharge;
    #shopping;
    #trip;
    #bikeRepair;
    #medical : MedicalCategory;
    #cashTransfer : CashTransferCategory;
    #others;
  };

  public type MedicalCategory = {
    #medicine;
    #hospital;
  };

  public type CashTransferCategory = {
    #family;
    #needToPay;
    #repay;
  };

  public type Expense = {
    id : Nat;
    date : Text;
    category : Category;
    subCategory : ?Text;
    amount : Nat;
    note : ?Text;
    repayName : ?Text;
  };

  module Expense {
    public func compareByDate(e1 : Expense, e2 : Expense) : Order.Order {
      Text.compare(e1.date, e2.date);
    };
  };

  public type UserProfile = {
    name : Text;
  };

  let expenses = Map.empty<Nat, Expense>();
  var nextId = 0;
  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func addExpense(
    date : Text,
    category : Category,
    subCategory : ?Text,
    amount : Nat,
    note : ?Text,
    repayName : ?Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add expenses");
    };
    let id = nextId;
    let expense : Expense = {
      id;
      date;
      category;
      subCategory;
      amount;
      note;
      repayName;
    };
    expenses.add(id, expense);
    nextId += 1;
    id;
  };

  public query ({ caller }) func getExpenses() : async [Expense] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };
    expenses.values().toArray();
  };

  public query ({ caller }) func getExpensesByDate(date : Text) : async [Expense] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };
    expenses.values().toArray().filter(func(expense) { expense.date == date });
  };

  public query ({ caller }) func getExpensesByDateRange(startDate : Text, endDate : Text) : async [Expense] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };
    expenses.values().toArray().filter(
      func(expense) {
        expense.date >= startDate and expense.date <= endDate
      }
    );
  };

  public shared ({ caller }) func deleteExpense(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete expenses");
    };
    if (not expenses.containsKey(id)) {
      Runtime.trap("Expense not found");
    };
    expenses.remove(id);
  };
};
