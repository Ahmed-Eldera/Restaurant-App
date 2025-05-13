import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms";
import { Observable } from "rxjs";
import { Dish } from "../../models/dish.model";
import { DishService } from "../../services/dish.service";

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  selector: "app-admin",
  templateUrl: "./admin.component.html",
  styleUrls: ["./admin.component.css"],
})
export class AdminComponent implements OnInit {
  dishes$: Observable<Dish[]>;
  dishForm: FormGroup;
  isEditing = false;
  currentDishId: string | null = null;
  loading = false;
  successMessage = "";
  errorMessage = "";

  constructor(
    private dishService: DishService,
    private fb: FormBuilder,
  ) {
    this.dishes$ = this.dishService.getAllDishes();

    this.dishForm = this.fb.group({
      name: ["", [Validators.required]],
      description: ["", [Validators.required]],
      price: ["", [Validators.required, Validators.min(0.01)]],
      category: ["", [Validators.required]],
      imageUrl: ["", [Validators.required]],
      available: [true],
      featured: [false],
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.dishForm.invalid) {
      return;
    }

    this.loading = true;
    this.successMessage = "";
    this.errorMessage = "";

    const dish: Dish = this.dishForm.value;

    if (this.isEditing && this.currentDishId) {
      const updatedDish: Dish = { ...dish, id: this.currentDishId }; // ✅ fix here
      this.dishService.updateDish(updatedDish).subscribe({
        next: () => {
          this.successMessage = "Dish updated successfully!";
          this.resetForm();
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = "Failed to update dish. Please try again.";
          console.error("Update error:", error);
          this.loading = false;
        },
      });
    } else {
      const newDish: Dish = {
        ...dish,
        id: this.generateId(), // Assign unique ID for Firestore doc
      };
      this.dishService.addDish(newDish).subscribe({
        next: () => {
          this.successMessage = "Dish added successfully!";
          this.resetForm();
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = "Failed to add dish. Please try again.";
          console.error("Add error:", error);
          this.loading = false;
        },
      });
    }
  }

  editDish(dish: Dish): void {
    this.isEditing = true;
    this.currentDishId = dish.id || null;
    this.dishForm.patchValue({
      name: dish.name,
      description: dish.description,
      price: dish.price,
      category: dish.category,
      imageUrl: dish.imageUrl,
      available: dish.available,
      featured: dish.featured || false,
    });
  }

  deleteDish(id: string): void {
    if (confirm("Are you sure you want to delete this dish?")) {
      this.loading = true;
      this.dishService.deleteDish(id).subscribe({
        next: () => {
          this.successMessage = "Dish deleted successfully!";
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = "Failed to delete dish. Please try again.";
          console.error("Delete error:", error);
          this.loading = false;
        },
      });
    }
  }

  resetForm(): void {
    this.dishForm.reset({
      available: true,
      featured: false,
    });
    this.isEditing = false;
    this.currentDishId = null;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 12);
  }
}
