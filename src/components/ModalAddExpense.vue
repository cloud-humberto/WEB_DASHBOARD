<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-title-wrapper">
          <div class="icon-wrap rose">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </div>
          <div>
            <h3 class="modal-title">Record Operating Expense</h3>
            <span class="modal-subtitle">Add overhead, vendor invoice or facility cost</span>
          </div>
        </div>
        <button class="btn-close" @click="$emit('close')">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label class="form-label">EXPENSE CATEGORY *</label>
          <select v-model="form.category" class="form-select" required>
            <option value="Rent & Facilities">Rent & Facilities</option>
            <option value="Utilities">Utilities (Electricity, Water, HVAC)</option>
            <option value="Technology & SaaS">Technology, Internet & SaaS</option>
            <option value="Inventory Restock">Inventory Wholesale Restock</option>
            <option value="Maintenance & Supplies">Maintenance & Store Supplies</option>
            <option value="Payroll">Staff & Operator Payroll</option>
            <option value="Taxes & Accounting">Taxes & Accounting Fees</option>
            <option value="Other Overhead">Other Overhead</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">DESCRIPTION / VENDOR *</label>
          <input
            v-model="form.description"
            type="text"
            class="form-input"
            placeholder="e.g. Wholesale Beverage Supply Co."
            required
          />
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">AMOUNT (USD) *</label>
            <div class="input-with-prefix">
              <span class="prefix">$</span>
              <input
                v-model.number="form.amount"
                type="number"
                step="0.01"
                min="0.01"
                class="form-input pl-currency mono"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div class="form-group flex-1">
            <label class="form-label">PAYMENT METHOD</label>
            <select v-model="form.payment_method" class="form-select">
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Direct Debit">Direct Debit</option>
              <option value="Cash">Cash (Store Vault)</option>
              <option value="Pix">Pix / Instant</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">EXPENSE DATE</label>
            <input
              v-model="form.date"
              type="date"
              class="form-input"
            />
          </div>

          <div class="form-group flex-1">
            <label class="form-label">AUTHORIZED OPERATOR</label>
            <input
              v-model="form.operator"
              type="text"
              class="form-input"
              placeholder="STORE MANAGER"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            Cancel
          </button>
          <button type="submit" class="btn btn-emerald" :disabled="isSubmitting">
            {{ isSubmitting ? 'Saving...' : 'Confirm & Save' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'ModalAddExpense',
  data() {
    return {
      isSubmitting: false,
      form: {
        category: 'Inventory Restock',
        description: '',
        amount: null,
        payment_method: 'Bank Transfer',
        date: new Date().toISOString().slice(0, 10),
        operator: 'STORE MANAGER'
      }
    };
  },
  methods: {
    ...mapActions('finance', ['createExpense']),

    async handleSubmit() {
      if (!this.form.description || !this.form.amount) return;

      this.isSubmitting = true;
      try {
        const fullDate = `${this.form.date}T${new Date().toTimeString().slice(0, 8)}.000Z`;
        await this.createExpense({
          ...this.form,
          date: fullDate,
          source: 'manual'
        });
        this.$emit('close');
      } catch (err) {
        alert('Failed to save expense: ' + err.message);
      } finally {
        this.isSubmitting = false;
      }
    }
  }
};
</script>

<style scoped>
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-subtle);
}

.modal-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-wrap.rose {
  background: var(--accent-rose-glow);
  color: var(--accent-rose);
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.modal-subtitle {
  font-size: 11px;
  color: var(--text-muted);
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 24px;
  color: var(--text-muted);
  cursor: pointer;
  line-height: 1;
}
.btn-close:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.form-row {
  display: flex;
  gap: 16px;
}
.flex-1 { flex: 1; }

.input-with-prefix {
  position: relative;
}
.prefix {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-weight: 700;
}
.pl-currency {
  padding-left: 26px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
}
</style>
