import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  type Category = {
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

  type MedicalCategory = {
    #medicine;
    #hospital;
  };

  type CashTransferCategory = {
    #family;
    #needToPay;
    #repay;
  };

  type Expense = {
    id : Nat;
    date : Text;
    category : Category;
    subCategory : ?Text;
    amount : Nat;
    note : ?Text;
    repayName : ?Text;
  };

  type UserProfile = {
    name : Text;
  };

  type OldActor = {
    // Assume original state was persistent
    expenses : Map.Map<Nat, Expense>;
    nextId : Nat;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  type NewActor = {
    // Want to reset state to new, empty maps
    expenses : Map.Map<Nat, Expense>;
    nextId : Nat;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  public func run(_old : OldActor) : NewActor {
    // Always reset to empty persistent maps and default nextId
    {
      expenses = Map.empty<Nat, Expense>();
      nextId = 0;
      userProfiles = Map.empty<Principal, UserProfile>();
    };
  };
};
