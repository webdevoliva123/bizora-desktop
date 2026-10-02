"use client";

import { Plus, Trash2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useSetupState } from "./setup-state";

export function CustomersStep() {
  const { setupData, updateSetupData } = useSetupState();

  const addCustomer = () => {
    updateSetupData("customers", [
      ...setupData.customers,
      {
        id: crypto.randomUUID(),
        type: "person",
        firstName: "",
        lastName: "",
        businessName: "",
        contactPerson: "",
        phone: "",
        email: "",
        taxRegistration: "",
        address: "",
      },
    ]);
  };

  const removeCustomer = (id: string) => {
    updateSetupData(
      "customers",
      setupData.customers.filter((customer) => customer.id !== id),
    );
  };

  const updateCustomer = (
    id: string,
    field:
      | "type"
      | "firstName"
      | "lastName"
      | "businessName"
      | "contactPerson"
      | "phone"
      | "email"
      | "taxRegistration"
      | "address",
    value: string,
  ) => {
    updateSetupData(
      "customers",
      setupData.customers.map((customer) =>
        customer.id === id
          ? {
              ...customer,
              [field]:
                field === "type"
                  ? (value as "person" | "business")
                  : value,
            }
          : customer,
      ),
    );
  };

  return (
    <div className="py-4">
      <div className="mb-8">
        <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <UserRound className="size-5" />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Customers
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Add your existing customers now, or skip this step and
              add them later.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCustomer}
          >
            <Plus className="size-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {setupData.customers.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <UserRound className="mx-auto size-8 text-muted-foreground" />

          <p className="mt-3 text-sm font-medium">
            No customers added yet
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            You can add customers now or create them later from the
            Customers section.
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-5"
            onClick={addCustomer}
          >
            <Plus className="size-4" />
            Add Customer
          </Button>
        </div>
      )}

      <div className="space-y-5">
        {setupData.customers.map((customer, index) => (
          <div
            key={customer.id}
            className="rounded-lg border p-5"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Customer {index + 1}
                </p>

                <p className="text-xs text-muted-foreground">
                  Customer information
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeCustomer(customer.id)}
                aria-label={`Remove customer ${index + 1}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="space-y-5">
              {/* Customer Type */}
              <div className="space-y-2">
                <Label htmlFor={`customer-type-${customer.id}`}>
                  Customer Type
                </Label>

                <select
                  id={`customer-type-${customer.id}`}
                  value={customer.type}
                  onChange={(event) =>
                    updateCustomer(
                      customer.id,
                      "type",
                      event.target.value,
                    )
                  }
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="person">Person</option>
                  <option value="business">Business</option>
                </select>
              </div>

              {/* Person */}
              {customer.type === "person" && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`first-name-${customer.id}`}>
                      First Name
                    </Label>

                    <Input
                      id={`first-name-${customer.id}`}
                      value={customer.firstName}
                      onChange={(event) =>
                        updateCustomer(
                          customer.id,
                          "firstName",
                          event.target.value,
                        )
                      }
                      placeholder="First name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`last-name-${customer.id}`}>
                      Last Name
                    </Label>

                    <Input
                      id={`last-name-${customer.id}`}
                      value={customer.lastName}
                      onChange={(event) =>
                        updateCustomer(
                          customer.id,
                          "lastName",
                          event.target.value,
                        )
                      }
                      placeholder="Last name"
                    />
                  </div>
                </div>
              )}

              {/* Business */}
              {customer.type === "business" && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor={`business-name-${customer.id}`}>
                      Business Name
                    </Label>

                    <Input
                      id={`business-name-${customer.id}`}
                      value={customer.businessName}
                      onChange={(event) =>
                        updateCustomer(
                          customer.id,
                          "businessName",
                          event.target.value,
                        )
                      }
                      placeholder="Business name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`contact-person-${customer.id}`}>
                      Contact Person
                    </Label>

                    <Input
                      id={`contact-person-${customer.id}`}
                      value={customer.contactPerson}
                      onChange={(event) =>
                        updateCustomer(
                          customer.id,
                          "contactPerson",
                          event.target.value,
                        )
                      }
                      placeholder="Contact person's name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`tax-registration-${customer.id}`}>
                      Tax Registration
                      <span className="ml-1 text-muted-foreground">
                        (Optional)
                      </span>
                    </Label>

                    <Input
                      id={`tax-registration-${customer.id}`}
                      value={customer.taxRegistration}
                      onChange={(event) =>
                        updateCustomer(
                          customer.id,
                          "taxRegistration",
                          event.target.value,
                        )
                      }
                      placeholder="Tax registration number"
                    />
                  </div>
                </div>
              )}

              {/* Contact */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`phone-${customer.id}`}>
                    Phone
                  </Label>

                  <Input
                    id={`phone-${customer.id}`}
                    type="tel"
                    value={customer.phone}
                    onChange={(event) =>
                      updateCustomer(
                        customer.id,
                        "phone",
                        event.target.value,
                      )
                    }
                    placeholder="Phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`email-${customer.id}`}>
                    Email
                    <span className="ml-1 text-muted-foreground">
                      (Optional)
                    </span>
                  </Label>

                  <Input
                    id={`email-${customer.id}`}
                    type="email"
                    value={customer.email}
                    onChange={(event) =>
                      updateCustomer(
                        customer.id,
                        "email",
                        event.target.value,
                      )
                    }
                    placeholder="Email address"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor={`address-${customer.id}`}>
                  Address
                  <span className="ml-1 text-muted-foreground">
                    (Optional)
                  </span>
                </Label>

                <Textarea
                  id={`address-${customer.id}`}
                  value={customer.address}
                  onChange={(event) =>
                    updateCustomer(
                      customer.id,
                      "address",
                      event.target.value,
                    )
                  }
                  placeholder="Customer address"
                  rows={3}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}